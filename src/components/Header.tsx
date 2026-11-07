import Link from "next/link";
import { getCurrentUser, ADMIN_PHONE } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { ROLE_LABEL } from "@/lib/constants";

export default async function Header() {
  const user = await getCurrentUser();
  const links: { href: string; label: string }[] = [{ href: "/garages", label: "تعمیرگاه‌ها" }];
  if (user?.role === "customer") {
    links.push({ href: "/requests", label: "درخواست‌های من" }, { href: "/requests/new", label: "ارزیابی رایگان" });
  }
  if (user?.role === "business") {
    links.push(
      { href: "/business", label: "داشبورد" },
      { href: "/business/board", label: "تابلوی درخواست‌ها" },
      { href: "/business/jobs", label: "نوبت‌ها" },
      { href: "/business/garage", label: "پروفایل گاراژ" }
    );
  }
  if (user?.role === "admin" && user.phone === ADMIN_PHONE) {
    links.push(
      { href: "/admin", label: "مدیریت" },
      { href: "/admin/requests", label: "سفارشات" },
      { href: "/business/board", label: "تابلوی درخواست‌ها" },
      { href: "/business", label: "گاراژ من" }
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-ink-900/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-lg">🚗</span>
          <span className="text-lg font-extrabold tracking-tight">اورژانس خودرو</span>
        </Link>
        <nav className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-sm font-semibold">{user.name || "کاربر جدید"}</div>
              <div className="text-[11px] text-slate-400">{ROLE_LABEL[user.role]}</div>
            </div>
            <form action={logoutAction}>
              <button className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">
                خروج
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="btn-primary shrink-0 !py-2">
            ورود / ثبت‌نام
          </Link>
        )}
      </div>
    </header>
  );
}
