import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStoragePath } from "@/lib/resources";
import { readFile } from "node:fs/promises";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new Response("غير مصرح", { status: 401 });
  }

  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      halaqa: { include: { enrollments: { select: { studentId: true } } } },
    },
  });

  if (!resource || !resource.filePath || !resource.mimeType) {
    return new Response("غير موجود", { status: 404 });
  }

  // التحقق من صلاحية الوصول.
  let allowed = false;

  if (session.role === "ADMIN") {
    allowed = true;
  } else if (session.role === "TEACHER") {
    const halaqa = resource.halaqaId
      ? await prisma.halaqa.findFirst({
          where: { id: resource.halaqaId, teacherId: session.userId },
          select: { id: true },
        })
      : null;
    allowed = resource.uploadedBy === session.userId || Boolean(halaqa);
  } else if (session.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (student) {
      const enrolled = resource.halaqaId
        ? resource.halaqa?.enrollments.some((e) => e.studentId === student.id)
        : true;
      allowed = Boolean(enrolled);
    }
  } else if (session.role === "PARENT") {
    const children = await prisma.student.findMany({
      where: { parentId: session.userId },
      select: { id: true },
    });
    const childIds = new Set(children.map((c) => c.id));
    if (resource.halaqaId) {
      allowed = resource.halaqa?.enrollments.some((e) => childIds.has(e.studentId)) ?? false;
    } else {
      allowed = children.length > 0;
    }
  }

  if (!allowed) {
    return new Response("غير مصرح", { status: 403 });
  }

  let data: Buffer;
  try {
    data = await readFile(getStoragePath(resource.filePath));
  } catch {
    return new Response("غير موجود", { status: 404 });
  }

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": resource.mimeType,
      "Content-Disposition": `attachment; filename="${resource.title}"`,
      "Content-Length": String(data.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
