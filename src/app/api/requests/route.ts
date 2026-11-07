import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { open, unlink } from "fs/promises";
import { db } from "@/db";
import { requestMedia, serviceRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CITIES, MAX_FILES, MAX_IMAGE_MB, MAX_VIDEO_MB, MAX_TOTAL_UPLOAD_MB, MAX_VIDEOS, MIN_IMAGES, SERVICES } from "@/lib/constants";
import { ensureUploadDir, extFor, filePath, hasValidMagicBytes } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bad(error: string, status = 400) {
  return Response.json({ error }, { status });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.name) return bad("ابتدا وارد حساب کاربری شوید", 401);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("ارسال اطلاعات ناموفق بود. حجم فایل‌ها را بررسی کنید");
  }

  const carModel = String(form.get("carModel") || "").trim().slice(0, 100);
  const carYear = String(form.get("carYear") || "").trim().slice(0, 10);
  const carColor = String(form.get("carColor") || "").trim().slice(0, 40);
  const city = String(form.get("city") || "").trim();
  const description = String(form.get("description") || "").trim().slice(0, 2000);
  const valid = SERVICES.map((s) => s.key as string);
  const services = form.getAll("services").map(String).filter((s) => valid.includes(s));
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (carModel.length < 2) return bad("مدل خودرو را وارد کنید");
  if (!CITIES.includes(city)) return bad("شهر را انتخاب کنید");
  if (services.length === 0) return bad("حداقل یک خدمت را انتخاب کنید");
  const imageFiles = files.filter((f) => f.type.startsWith("image/"));
  const videoFiles = files.filter((f) => f.type.startsWith("video/"));
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (imageFiles.length < MIN_IMAGES) {
    return bad(`حداقل ${MIN_IMAGES} عکس از خودرو لازم است`);
  }
  if (videoFiles.length > MAX_VIDEOS) {
    return bad(`حداکثر ${MAX_VIDEOS} فیلم مجاز است`);
  }
  if (files.length > MAX_FILES) {
    return bad(`حداکثر ${MAX_FILES} فایل مجاز است`);
  }

  for (const f of files) {
    const ext = extFor(f.type);
    if (!ext) return bad(`فرمت فایل «${f.name}» پشتیبانی نمی‌شود`);

    const isVideo = f.type.startsWith("video/");
    const limit = (isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024;

    if (f.size > limit) {
      return bad(`حجم فایل «${f.name}» بیش از حد مجاز است`);
    }
  }

  if (totalSize > MAX_TOTAL_UPLOAD_MB * 1024 * 1024) {
    return bad(`حجم مجموع فایل‌ها نباید بیشتر از ${MAX_TOTAL_UPLOAD_MB} مگابایت باشد`);
  }

  const fileBuffers: Buffer[] = [];

  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());

    if (!hasValidMagicBytes(f.type, buf)) {
      return bad(`محتوای فایل «${f.name}» با فرمت اعلام‌شده مطابقت ندارد`);
    }

    fileBuffers.push(buf);
  }

  await ensureUploadDir();
  const [created] = await db
    .insert(serviceRequests)
    .values({ customerId: user.id, carModel, carYear, carColor, city, description, services })
    .returning({ id: serviceRequests.id });

  const savedFiles: string[] = [];

  try {
    for (const [index, f] of files.entries()) {
      const name = `${created.id}-${randomBytes(10).toString("hex")}.${extFor(f.type)}`;
      const buf = fileBuffers[index];

      const handle = await open(filePath(name), "wx");
      savedFiles.push(name);

      try {
        await handle.writeFile(buf);
      } finally {
        await handle.close();
      }

      await db.insert(requestMedia).values({
        requestId: created.id,
        kind: f.type.startsWith("video/") ? "video" : "image",
        fileName: name,
        mime: f.type,
        size: f.size,
      });
    }
  } catch {
    await Promise.all(
      savedFiles.map(async (name) => {
        try {
          await unlink(filePath(name));
        } catch {}
      })
    );

    try {
      await db.delete(serviceRequests).where(eq(serviceRequests.id, created.id));
    } catch {}

    return bad("ذخیره درخواست یا فایل‌ها ناموفق بود. دوباره تلاش کنید", 500);
  }

  return Response.json({ id: created.id });
}
