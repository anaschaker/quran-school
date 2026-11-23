import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const STORAGE_DIR = path.join(process.cwd(), "data", "resources");
const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIMES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "audio/mpeg": [".mp3"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

function detectMime(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // MP3: ID3 tag or MPEG frame sync
  if (buffer.length >= 3 && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return "audio/mpeg";
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xf3 || buffer[1] === 0xf2)) {
    return "audio/mpeg";
  }
  return null;
}

export type SavedFile = {
  filePath: string;
  mimeType: string;
  size: number;
  originalName: string;
};

export async function saveUploadedFile(file: File): Promise<SavedFile> {
  if (file.size === 0) throw new Error("empty");
  if (file.size > MAX_SIZE) throw new Error("too-large");

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = detectMime(buffer);
  if (!mime || !ALLOWED_MIMES[mime]) {
    throw new Error("invalid-type");
  }

  await ensureStorageDir();
  const ext = ALLOWED_MIMES[mime][0];
  const filename = `${randomUUID()}${ext}`;
  const fullPath = path.join(STORAGE_DIR, filename);
  await fs.writeFile(fullPath, buffer);

  return {
    filePath: filename,
    mimeType: mime,
    size: buffer.length,
    originalName: file.name,
  };
}

export function getStoragePath(filename: string): string {
  return path.join(STORAGE_DIR, filename);
}

export const RESOURCE_ALLOWED_TYPES = Object.keys(ALLOWED_MIMES);
export const RESOURCE_MAX_SIZE = MAX_SIZE;
