import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-4 text-2xl font-extrabold">صفحه مورد نظر یافت نشد</h1>
      <p className="mt-2 text-sm text-slate-500">ممکن است این صفحه حذف شده باشد یا به آن دسترسی نداشته باشید.</p>
      <Link href="/" className="btn-primary mt-6">
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
