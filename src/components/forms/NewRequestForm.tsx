"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES, MAX_FILES, MAX_IMAGE_MB, MAX_VIDEO_MB, MAX_TOTAL_UPLOAD_MB, MAX_VIDEOS, MIN_IMAGES, SERVICES } from "@/lib/constants";

type Picked = { file: File; url: string };

export default function NewRequestForm() {
  const router = useRouter();
  const [files, setFiles] = useState<Picked[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [guideAccepted, setGuideAccepted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  function addFiles(list: FileList | null) {
    if (!list || !guideAccepted) return;
    setError("");

    const next = [...files];
    let errorMessage = "";

    for (const f of Array.from(list)) {
      const isVideo = f.type.startsWith("video/");
      const isImage = f.type.startsWith("image/");

      if (!isVideo && !isImage) {
        errorMessage = `فایل «${f.name}» عکس یا ویدیو نیست`;
        continue;
      }

      const limit = (isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024;
      if (f.size > limit) {
        errorMessage = `حجم «${f.name}» بیشتر از ${isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB} مگابایت است`;
        continue;
      }

      if (isVideo && next.some((item) => item.file.type.startsWith("video/"))) {
        errorMessage = `حداکثر ${MAX_VIDEOS} فیلم مجاز است`;
        continue;
      }

      if (next.length >= MAX_FILES) {
        errorMessage = `حداکثر ${MAX_FILES} فایل قابل بارگذاری است`;
        break;
      }

      const totalSize = next.reduce((sum, item) => sum + item.file.size, 0) + f.size;
      if (totalSize > MAX_TOTAL_UPLOAD_MB * 1024 * 1024) {
        errorMessage = `حجم مجموع فایل‌ها نباید بیشتر از ${MAX_TOTAL_UPLOAD_MB} مگابایت باشد`;
        continue;
      }

      next.push({ file: f, url: URL.createObjectURL(f) });
    }

    setFiles(next);
    if (errorMessage) setError(errorMessage);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleService(k: string) {
    setServices((prev) => (prev.includes(k) ? prev.filter((s) => s !== k) : [...prev, k]));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!guideAccepted) return setError("ابتدا راهنمای ارسال تصاویر را تأیید کنید");
    if (services.length === 0) return setError("حداقل یک خدمت را انتخاب کنید");
    const imageCount = files.filter((f) => f.file.type.startsWith("image/")).length;
    const videoCount = files.filter((f) => f.file.type.startsWith("video/")).length;
    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

    if (imageCount < MIN_IMAGES) return setError(`حداقل ${MIN_IMAGES} عکس از خودرو لازم است`);
    if (videoCount > MAX_VIDEOS) return setError(`حداکثر ${MAX_VIDEOS} فیلم مجاز است`);
    if (files.length > MAX_FILES) return setError(`حداکثر ${MAX_FILES} فایل مجاز است`);
    if (totalSize > MAX_TOTAL_UPLOAD_MB * 1024 * 1024) {
      return setError(`حجم مجموع فایل‌ها نباید بیشتر از ${MAX_TOTAL_UPLOAD_MB} مگابایت باشد`);
    }
    const fd = new FormData(e.currentTarget);
    fd.delete("files");
    services.forEach((s) => fd.append("services", s));
    files.forEach((f) => fd.append("files", f.file));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/requests");
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      let data: { id?: number; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status === 200 && data.id) {
        router.push(`/requests/${data.id}?created=1`);
        router.refresh();
      } else {
        setProgress(null);
        setError(data.error || "خطا در ثبت درخواست. دوباره تلاش کنید");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("ارتباط با سرور برقرار نشد");
    };
    setProgress(0);
    xhr.send(fd);
  }

  const uploading = progress !== null;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-4 font-bold">۱. چه خدمتی نیاز دارید؟</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {SERVICES.map((s) => {
            const on = services.includes(s.key);
            return (
              <button
                type="button"
                key={s.key}
                onClick={() => toggleService(s.key)}
                className={`rounded-2xl border-2 p-4 text-right transition ${
                  on ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{s.icon}</span>
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-md border text-xs ${
                      on ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                </div>
                <div className="mt-2 font-bold">{s.label}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-bold">۲. عکس و فیلم کوتاه از آسیب‌دیدگی</h2>
        <p className="mb-4 text-xs text-slate-500">
          از چند زاویه و در نور کافی عکس بگیرید. ویدیوی کوتاه (زیر ۳۰ ثانیه) به ارزیابی دقیق‌تر کمک می‌کند. عکس تا{" "}
          {MAX_IMAGE_MB} مگابایت، ویدیو تا {MAX_VIDEO_MB} مگابایت.
        </p>
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-slate-800">
          <h3 className="mb-3 font-bold">راهنمای ارسال تصاویر خودرو</h3>
          <ul className="list-inside list-disc space-y-2 text-sm leading-7">
            <li>از قسمت آسیب‌دیده خودرو عکس واضح بگیرید.</li>
            <li>از چند زاویه مختلف عکس ارسال کنید.</li>
            <li>تصاویر باید نور کافی داشته باشند.</li>
            <li>تمام قسمت آسیب‌دیده در تصویر مشخص باشد.</li>
            <li>از ارسال تصاویر تار یا ویرایش‌شده خودداری کنید.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-600">
            تصاویر صرفاً برای بررسی درخواست تعمیر و برآورد هزینه استفاده می‌شوند.
          </p>
          <label className="mt-4 flex cursor-pointer items-center gap-2 border-t border-amber-200 pt-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={guideAccepted}
              onChange={(e) => setGuideAccepted(e.target.checked)}
              disabled={uploading}
              className="h-5 w-5 accent-amber-600"
            />
            متوجه شدم و آماده ارسال عکس هستم.
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {files.map((f, i) => (
            <div key={f.url} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              {f.file.type.startsWith("video/") ? (
                <video src={f.url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt="" className="h-full w-full object-cover" />
              )}
              {f.file.type.startsWith("video/") && (
                <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  🎬 ویدیو
                </span>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute left-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-600"
                  aria-label="حذف"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {files.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || !guideAccepted}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-brand-400 hover:text-brand-600"
            >
              <span className="text-3xl">📷</span>
              <span className="text-xs font-semibold">افزودن عکس / فیلم</span>
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          name="files"
          accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm,video/3gpp"
          multiple
          disabled={uploading || !guideAccepted}
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </section>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">۳. مشخصات خودرو</h2>
        <div>
          <label className="label">مدل خودرو *</label>
          <input name="carModel" className="input" placeholder="مثلاً پژو ۲۰۶ تیپ ۵" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">سال ساخت</label>
            <input name="carYear" className="input" placeholder="۱۴۰۰" />
          </div>
          <div>
            <label className="label">رنگ</label>
            <input name="carColor" className="input" placeholder="سفید" />
          </div>
        </div>
        <div>
          <label className="label">شهر *</label>
          <select name="city" className="input" required defaultValue="">
            <option value="" disabled>
              انتخاب کنید
            </option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">توضیحات</label>
          <textarea
            name="description"
            rows={4}
            className="input"
            placeholder="مثلاً: ضربه به گلگیر جلو سمت راست، سپر ترک خورده، نیاز به پولیش کامل..."
          />
        </div>
      </section>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {uploading && (
        <div className="card p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>در حال بارگذاری فایل‌ها...</span>
            <span dir="ltr">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <button type="submit" disabled={uploading} className="btn-primary w-full !py-3.5 text-base">
        {uploading ? "در حال ارسال..." : "ارسال رایگان برای ارزیابی تعمیرگاه‌ها"}
      </button>
    </form>
  );
}
