import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "quran_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 أيام

export type AppRole = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export type SessionPayload = {
  userId: string;
  role: AppRole;
  name: string;
  mustChangePassword: boolean;
};

export const ROLE_HOME: Record<AppRole, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  ADMIN: "مدير المدرسة",
  TEACHER: "معلم",
  STUDENT: "طالب",
  PARENT: "ولي أمر",
};

const ROLE_PREFIX: Record<AppRole, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

const JWT_ISSUER = "quran-school";
const JWT_AUDIENCE = "quran-school-web";

export function isAppRole(value: unknown): value is AppRole {
  return (
    value === "ADMIN" ||
    value === "TEACHER" ||
    value === "STUDENT" ||
    value === "PARENT"
  );
}

export function getRequiredRole(pathname: string): AppRole | null {
  for (const [role, prefix] of Object.entries(ROLE_PREFIX)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role as AppRole;
    }
  }

  return null;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET غير معرّف أو قصير جدًا. أضف مفتاحًا عشوائيًا بطول 32 حرفًا على الأقل.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);

  return new SignJWT({
    role: payload.role,
    name: payload.name,
    mustChangePassword: payload.mustChangePassword,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setJti(crypto.randomUUID())
    .setExpirationTime(issuedAt + SESSION_MAX_AGE)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      !isAppRole(payload.role)
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role,
      name: payload.name,
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return null;
  }
}
