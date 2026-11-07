import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ADMIN_PHONE } from "@/lib/auth";
import AdminSetupForm from "@/components/forms/AdminSetupForm";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  if (!ADMIN_PHONE) {
    return <main className="mx-auto max-w-md px-4 py-16"><div className="card p-7">تنظیمات مدیر کل در سرور کامل نیست.</div></main>;
  }

  const [mainAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.phone, ADMIN_PHONE), eq(users.role, "admin")))
    .limit(1);

  if (mainAdmin) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="card p-7">
          <h1 className="text-xl font-extrabold">راه‌اندازی انجام شده است</h1>
          <p className="mt-2 text-sm text-slate-600">حساب مدیر کل قبلاً ایجاد شده است.</p>
          <a href="/login" className="btn-primary mt-5 block w-full text-center">رفتن به صفحه ورود</a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="card p-7">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-2xl">🔐</div>
          <h1 className="mt-3 text-xl font-extrabold">راه‌اندازی مدیر کل</h1>
          <p className="mt-2 text-sm text-slate-500">این مرحله فقط یک‌بار برای ساخت حساب اصلی سامانه انجام می‌شود.</p>
        </div>
        <AdminSetupForm />
      </div>
    </main>
  );
}
