import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, garages, messages, offers, serviceRequests, users } from "@/db/schema";
import { requireMainAdmin } from "@/lib/auth";
import { REQUEST_STATUS } from "@/lib/constants";
import { formatDateTime, formatToman, timeAgo, toFaDigits } from "@/lib/format";
import { Badge, PageTitle, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireMainAdmin();
  const [c] = await db
    .select({
      users: sql<number>`(select count(*)::int from ${users})`,
      garagesApproved: sql<number>`(select count(*)::int from ${garages} where status='approved')`,
      garagesPending: sql<number>`(select count(*)::int from ${garages} where status='pending')`,
      open: sql<number>`(select count(*)::int from ${serviceRequests} where status='open')`,
      active: sql<number>`(select count(*)::int from ${bookings} where status in ('scheduled','in_progress'))`,
      completed: sql<number>`(select count(*)::int from ${bookings} where status='completed')`,
      offers: sql<number>`(select count(*)::int from ${offers})`,
      revenue: sql<number>`(select coalesce(sum(o.price),0)::bigint from ${bookings} b join ${offers} o on o.id=b.offer_id where b.status='completed')`,
    })
    .from(sql`(select 1) x`);

  const unread = await db
    .select({
      requestId: messages.requestId,
      participantId: messages.participantId,
      name: users.name,
      role: users.role,
      body: sql<string>`(array_agg(${messages.body} order by ${messages.createdAt} desc))[1]`,
      last: sql<Date>`max(${messages.createdAt})`,
      count: sql<number>`count(*)::int`,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.participantId))
    .where(eq(messages.readByAdmin, false))
    .groupBy(messages.requestId, messages.participantId, users.name, users.role)
    .orderBy(desc(sql`max(${messages.createdAt})`))
    .limit(10);

  const upcoming = await db
    .select({ b: bookings, carModel: serviceRequests.carModel, garage: garages.name, customer: users.name, price: offers.price })
    .from(bookings)
    .innerJoin(serviceRequests, eq(serviceRequests.id, bookings.requestId))
    .innerJoin(garages, eq(garages.id, bookings.garageId))
    .innerJoin(users, eq(users.id, bookings.customerId))
    .innerJoin(offers, eq(offers.id, bookings.offerId))
    .where(sql`${bookings.status} in ('scheduled','in_progress')`)
    .orderBy(bookings.scheduledAt)
    .limit(8);

  const recent = await db
    .select({ r: serviceRequests, customer: users.name, offerCount: sql<number>`(select count(*)::int from ${offers} where ${offers.requestId}=${serviceRequests.id})` })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .orderBy(desc(serviceRequests.createdAt))
    .limit(8);

  return (
    <div>
      <PageTitle title="داشبورد مدیریت" subtitle="نظارت بر همه فعالیت‌ها و پیگیری سفارشات" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="📋" label="درخواست باز" value={c.open} tone="sky" />
        <StatCard icon="📅" label="سفارش فعال" value={c.active} tone="violet" />
        <StatCard icon="✅" label="سفارش تکمیل‌شده" value={c.completed} tone="green" />
        <StatCard icon="💰" label="ارزش سفارشات تکمیل‌شده" value={formatToman(Number(c.revenue))} tone="orange" />
        <StatCard icon="👥" label="کاربران" value={c.users} />
        <StatCard icon="🏭" label="تعمیرگاه فعال" value={c.garagesApproved} />
        <StatCard icon="⏳" label="تعمیرگاه در انتظار تأیید" value={c.garagesPending} tone="orange" />
        <StatCard icon="💬" label="کل پیشنهادها" value={c.offers} />
      </div>

      {c.garagesPending > 0 && (
        <Link
          href="/admin/garages?status=pending"
          className="mt-4 block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100"
        >
          ⚠️ {toFaDigits(c.garagesPending)} تعمیرگاه منتظر بررسی و تأیید شماست ←
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-bold">💬 پیام‌های خوانده‌نشده</h2>
          {unread.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">پیام جدیدی وجود ندارد.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {unread.map((m) => (
                <Link
                  key={`${m.requestId}-${m.participantId}`}
                  href={`/admin/requests/${m.requestId}#thread-${m.participantId}`}
                  className="block py-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {m.name} <span className="text-xs font-normal text-slate-500">({m.role === "business" ? "تعمیرگاه" : "مشتری"} · درخواست {toFaDigits(m.requestId)})</span>
                    </span>
                    <span className="badge bg-brand-500 text-white">{toFaDigits(m.count)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">{m.body}</p>
                  <p className="text-xs text-slate-400">{timeAgo(m.last)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-bold">📅 نوبت‌های پیش‌رو</h2>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">نوبت فعالی وجود ندارد.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map((u) => (
                <Link key={u.b.id} href={`/admin/requests/${u.b.requestId}`} className="block py-3 text-sm hover:bg-slate-50">
                  <div className="flex justify-between">
                    <span className="font-semibold">{u.carModel}</span>
                    <span>{formatToman(u.price)}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {u.customer} ← {u.garage} · {formatDateTime(u.b.scheduledAt)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">🆕 آخرین درخواست‌ها</h2>
            <Link href="/admin/requests" className="text-sm font-semibold text-brand-600">
              همه ←
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr className="text-right">
                  <th className="p-2">کد</th>
                  <th className="p-2">خودرو</th>
                  <th className="p-2">مشتری</th>
                  <th className="p-2">شهر</th>
                  <th className="p-2">پیشنهادها</th>
                  <th className="p-2">وضعیت</th>
                  <th className="p-2">زمان</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(({ r, customer, offerCount }) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-2">
                      <Link href={`/admin/requests/${r.id}`} className="font-semibold text-brand-600">
                        {toFaDigits(r.id)}
                      </Link>
                    </td>
                    <td className="p-2">{r.carModel}</td>
                    <td className="p-2">{customer}</td>
                    <td className="p-2">{r.city}</td>
                    <td className="p-2">{toFaDigits(offerCount)}</td>
                    <td className="p-2">
                      <Badge map={REQUEST_STATUS} value={r.status} />
                    </td>
                    <td className="p-2 text-xs text-slate-500">{timeAgo(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
