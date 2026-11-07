import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, offers, serviceRequests } from "@/db/schema";
import { getOwnGarage, requireRole } from "@/lib/auth";
import { getGarageStats } from "@/lib/queries";
import { GARAGE_STATUS, OFFER_STATUS } from "@/lib/constants";
import { formatToman, timeAgo, toFaDigits } from "@/lib/format";
import { Badge, Notice, PageTitle, StatCard, Stars } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BusinessDashboard() {
  const user = await requireRole("business", "admin");
  const garage = await getOwnGarage(user.id);
  if (!garage) redirect("/business/garage?new=1");

  const stats = (await getGarageStats([garage.id])).get(garage.id)!;
  const [counts] = await db
    .select({
      open: sql<number>`(select count(*)::int from ${serviceRequests} where ${serviceRequests.status} = 'open' and ${serviceRequests.city} = ${garage.city})`,
      pending: sql<number>`(select count(*)::int from ${offers} where ${offers.garageId} = ${garage.id} and ${offers.status} = 'pending')`,
      accepted: sql<number>`(select count(*)::int from ${offers} where ${offers.garageId} = ${garage.id} and ${offers.status} = 'accepted')`,
      upcoming: sql<number>`(select count(*)::int from ${bookings} where ${bookings.garageId} = ${garage.id} and ${bookings.status} in ('scheduled','in_progress'))`,
    })
    .from(sql`(select 1) as x`);

  const myOffers = await db
    .select({ o: offers, carModel: serviceRequests.carModel, reqStatus: serviceRequests.status })
    .from(offers)
    .innerJoin(serviceRequests, eq(serviceRequests.id, offers.requestId))
    .where(and(eq(offers.garageId, garage.id)))
    .orderBy(desc(offers.updatedAt))
    .limit(8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageTitle
        title={garage.name}
        subtitle={`پنل تعمیرگاه · ${garage.city}`}
        action={
          <div className="flex items-center gap-3">
            <Badge map={GARAGE_STATUS} value={garage.status} />
            <Link href={`/garages/${garage.id}`} className="btn-ghost">
              مشاهده پروفایل عمومی
            </Link>
          </div>
        }
      />
      {garage.status === "pending" && (
        <div className="mb-6">
          <Notice tone="warn">
            ⏳ تعمیرگاه شما در انتظار بررسی مدیریت است. در این مدت نیز می‌توانید درخواست‌های مشتریان را ببینید و پیشنهاد قیمت ثبت کنید.
          </Notice>
        </div>
      )}
      {garage.status === "suspended" && (
        <div className="mb-6">
          <Notice tone="warn">⛔ فعالیت تعمیرگاه شما توسط مدیریت تعلیق شده است. با پشتیبانی تماس بگیرید.</Notice>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="📋" label={`درخواست باز در ${garage.city}`} value={counts.open} tone="sky" />
        <StatCard icon="💬" label="پیشنهادهای در انتظار" value={counts.pending} tone="orange" />
        <StatCard icon="📅" label="نوبت‌های فعال" value={counts.upcoming} tone="violet" />
        <StatCard icon="⭐" label={`امتیاز (${toFaDigits(stats.count)} نظر)`} value={stats.count ? toFaDigits(stats.avg.toFixed(1)) : "—"} tone="green" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">آخرین پیشنهادهای من</h2>
            <Link href="/business/board" className="text-sm font-semibold text-brand-600">
              تابلوی درخواست‌ها ←
            </Link>
          </div>
          {myOffers.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">هنوز پیشنهادی ثبت نکرده‌اید.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {myOffers.map(({ o, carModel }) => (
                <Link
                  key={o.id}
                  href={`/business/board/${o.requestId}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
                >
                  <div>
                    <div className="text-sm font-semibold">{carModel}</div>
                    <div className="text-xs text-slate-500">
                      کد {toFaDigits(o.requestId)} · {timeAgo(o.updatedAt)}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">{formatToman(o.price)}</div>
                    <Badge map={OFFER_STATUS} value={o.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="card space-y-3 p-5">
          <h2 className="font-bold">عملکرد</h2>
          <Stars value={stats.avg} count={stats.count} size="lg" />
          <div className="text-sm text-slate-600">✔️ {toFaDigits(stats.completed)} کار تکمیل‌شده</div>
          <div className="text-sm text-slate-600">🤝 {toFaDigits(counts.accepted)} پیشنهاد پذیرفته‌شده</div>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/business/jobs" className="btn-dark">
              مدیریت نوبت‌ها
            </Link>
            <Link href="/business/garage" className="btn-ghost">
              ویرایش پروفایل گاراژ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
