import Link from "next/link";
import type { ReactNode } from "react";
import { requireMainAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireMainAdmin();
  const links = [
    ["/admin", "📊 نمای کلی"],
    ["/admin/requests", "📋 سفارشات و درخواست‌ها"],
    ["/admin/garages", "🏭 تعمیرگاه‌ها"],
    ["/admin/users", "👥 کاربران"],
    ["/admin/reviews", "⭐ نظرات"],
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
