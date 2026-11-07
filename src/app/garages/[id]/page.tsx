import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { garages, reviews, users } from "@/db/schema";
import { getGarageStats } from "@/lib/queries";
import { getCurrentUser, ADMIN_PHONE } from "@/lib/auth";
import { Empty, ServiceChips, Stars } from "@/components/ui";
import { formatDate, toFaDigits } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GarageProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const [g] = await db
    .select({
      id: garages.id,
      name: garages.name,
      city: garages.city,
      district: garages.district,
      services: garages.services,
      description: garages.description,
      experienceYears: garages.experienceYears,
      workingHours: garages.workingHours,
      status: garages.status,
      ownerId: garages.ownerId,
      createdAt: garages.createdAt,
    })
    .from(garages)
    .where(eq(garages.id, Number(id)))
    .limit(1);
  if (!g) notFound();
  if (g.status !== "approved" && !(viewer?.role === "admin" && viewer.phone === ADMIN_PHONE) && viewer?.id !== g.ownerId) notFound();

  const stats = (await getGarageStats([g.id])).get(g.id)!;
  const list = await db
    .select({ r: reviews, name: users.name })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.customerId))
    .where(eq(reviews.garageId, g.id))
    .orderBy(desc(reviews.createdAt));
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: list.filter((x) => x.r.rating === n).length }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-l from-ink-900 to-ink-800" />
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
          <div className="flex items-end gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-brand-500 text-3xl font-black text-white shadow">
              {g.name.slice(0, 1)}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-extrabold">{g.name}</h1>
              <div className="text-sm text-slate-500">
                📍 {g.city}
                {g.district && ` · ${g.district}`} · عضو از {formatDate(g.createdAt)}
              </div>
            </div>
          </div>
          <Stars value={stats.avg} count={stats.count} size="lg" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="space-y-4">
          <div className="card space-y-3 p-5 text-sm">
            <h2 className="font-bold">مشخصات</h2>
            <ServiceChips services={g.services} />
            <div>✔️ {toFaDigits(stats.completed)} کار تکمیل‌شده</div>
            {g.experienceYears > 0 && <div>🏅 {toFaDigits(g.experienceYears)} سال سابقه</div>}
            {g.workingHours && <div>🕘 {g.workingHours}</div>}
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              🔒 برای حفظ حریم خصوصی، اطلاعات تماس و آدرس دقیق از طریق پشتیبانی پس از رزرو هماهنگ می‌شود.
            </p>
          </div>
          {(!viewer || viewer.role === "customer") && (
            <Link href={viewer ? "/requests/new" : "/login"} className="btn-primary w-full">
              دریافت قیمت رایگان
            </Link>
          )}
        </div>
        <div className="space-y-4 md:col-span-2">
          {g.description && (
            <div className="card p-5">
              <h2 className="mb-2 font-bold">درباره ما</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{g.description}</p>
            </div>
          )}
          <div className="card p-5">
            <h2 className="mb-4 font-bold">امتیاز و نظرات مشتریان</h2>
            {list.length > 0 && (
              <div className="mb-5 space-y-1.5">
                {dist.map((d) => (
                  <div key={d.n} className="flex items-center gap-2 text-xs">
                    <span className="w-10">{toFaDigits(d.n)} ستاره</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-amber-400" style={{ width: `${(d.c / list.length) * 100}%` }} />
                    </div>
                    <span className="w-6 text-slate-500">{toFaDigits(d.c)}</span>
                  </div>
                ))}
              </div>
            )}
            {list.length === 0 ? (
              <Empty icon="⭐" title="هنوز نظری ثبت نشده است" />
            ) : (
              <div className="divide-y divide-slate-100">
                {list.map(({ r, name }) => (
                  <div key={r.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{name.split(" ")[0] || "کاربر"}</span>
                      <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <Stars value={r.rating} />
                    {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
