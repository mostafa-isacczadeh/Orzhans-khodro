import "server-only";
import path from "path";
import { mkdir } from "fs/promises";

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export function filePath(name: string) {
  return path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, path.basename(name));
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/3gpp": "3gp",
};

export function extFor(mime: string) {
  return EXT[mime] ?? null;
}

export { hasValidMagicBytes } from "./magic-bytes";
