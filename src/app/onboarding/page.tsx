import { redirect } from "next/navigation";
import { getCurrentUser, ADMIN_PHONE } from "@/lib/auth";
import OnboardingForm from "@/components/forms/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="card p-7">
        <h1 className="text-xl font-extrabold">به اورژانس خودرو خوش آمدید 👋</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">برای تکمیل حساب، اطلاعات زیر را وارد کنید.</p>
        <OnboardingForm isAdmin={user.role === "admin" && user.phone === ADMIN_PHONE} defaultName={user.name} />
      </div>
    </div>
  );
}
