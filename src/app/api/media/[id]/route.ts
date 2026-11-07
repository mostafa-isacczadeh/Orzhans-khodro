import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { requestMedia } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canViewRequest } from "@/lib/queries";
import { filePath } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const [m] = await db.select().from(requestMedia).where(eq(requestMedia.id, Number(id))).limit(1);
  if (!m) return new Response("Not found", { status: 404 });
  if (!(await canViewRequest(user, m.requestId))) return new Response("Forbidden", { status: 403 });

  const p = filePath(m.fileName);
  let size: number;
  try {
    size = (await stat(p)).size;
  } catch {
    return new Response("File missing", { status: 404 });
  }

  const range = req.headers.get("range");
  const baseHeaders = {
    "Content-Type": m.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  };
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    let start = match && match[1] ? Number(match[1]) : 0;
    let end = match && match[2] ? Number(match[2]) : size - 1;
    if (match && !match[1] && match[2]) {
      start = Math.max(0, size - Number(match[2]));
      end = size - 1;
    }
    if (start >= size || end >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(createReadStream(p, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }
  const stream = Readable.toWeb(createReadStream(p)) as ReadableStream;
  return new Response(stream, { headers: { ...baseHeaders, "Content-Length": String(size) } });
}
