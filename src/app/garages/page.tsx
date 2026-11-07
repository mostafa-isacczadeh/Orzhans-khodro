import Link from "next/link";
import { and, eq, arrayContains, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { garages } from "@/db/schema";
import { getGarageStats } from "@/lib/queries";
import { CITIES, SERVICES } from "@/lib/constants";
import { Empty, PageTitle, ServiceChips, Stars } from "@/components/ui";
import { toFaDigits } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GaragesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; service?: string; sort?: string }>;
}) {
  const { city, service, sort } = await searchParams;
  const conds: SQL[] = [eq(garages.status, "approved")];
  if (city) conds.push(eq(garages.city, city));
  if (service) conds.push(arrayContains(garages.services, [service]));
  const list = await db
    .select({
      id: garages.id,
      name: garages.name,
      city: garages.city,
      district: garages.district,
      services: garages.services,
      description: garages.description,
      experienceYears: garages.experienceYears,
    })
    .from(garages)
    .where(and(...conds));
  const stats = await getGarageStats(list.map((g) => g.id));
  const rows = list.map((g) => ({ ...g, s: stats.get(g.id)! }));
  rows.sort((a, b) =>
    sort === "jobs" ? b.s.completed - a.s.completed : b.s.avg - a.s.avg || b.s.count - a.s.count
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageTitle title="تعمیرگاه‌های تأییدشده" subtitle="بر اساس امتیاز و نظرات واقعی مشتریان انتخاب کنید." />
      <form className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[140px] flex-1">
          <label className="label">شهر</label>
          <select name="city" defaultValue={city ?? ""} className="input">
            <option value="">همه شهرها</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="label">خدمت</label>
          <select name="service" defaultValue={service ?? ""} className="input">
            <option value="">همه خدمات</option>
            {SERVICES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="label">مرتب‌سازی</label>
          <select name="sort" defaultValue={sort ?? ""} className="input">
            <option value="">بیشترین امتیاز</option>
            <option value="jobs">بیشترین کار موفق</option>
          </select>
        </div>
        <button className="btn-dark">اعمال فیلتر</button>
      </form>

      {rows.length === 0 ? (
        <Empty icon="🏭" title="تعمیرگاهی با این مشخصات یافت نشد" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((g) => (
            <Link key={g.id} href={`/garages/${g.id}`} className="card flex flex-col p-5 transition hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-900 text-lg font-bold text-white">
                  {g.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold">{g.name}</div>
                  <div className="text-xs text-slate-500">
                    📍 {g.city}
                    {g.district && ` · ${g.district}`}
                  </div>
                  <Stars value={g.s.avg} count={g.s.count} />
                </div>
              </div>
              {g.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{g.description}</p>}
              <div className="mt-3">
                <ServiceChips services={g.services} />
              </div>
              <div className="mt-auto pt-3 text-xs text-slate-500">
                ✔️ {toFaDigits(g.s.completed)} کار تکمیل‌شده
                {g.experienceYears > 0 && ` · ${toFaDigits(g.experienceYears)} سال سابقه`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
