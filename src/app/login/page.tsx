import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import PasswordLoginForm from "@/components/forms/PasswordLoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.name ? homeFor(user.role, user.phone) : "/onboarding");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-7">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-2xl">🚗</div>
          <h1 className="mt-3 text-xl font-extrabold">ورود یا ثبت‌نام</h1>
          <p className="mt-1 text-sm text-slate-500">با شماره موبایل و رمز عبور وارد شوید یا حساب جدید بسازید.</p>
        </div>
        <PasswordLoginForm />
      </div>
    </div>
  );
}
