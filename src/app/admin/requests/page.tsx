import Link from "next/link";
import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, offers, serviceRequests, users } from "@/db/schema";
import { requireMainAdmin } from "@/lib/auth";
import { REQUEST_STATUS } from "@/lib/constants";
import { timeAgo, toFaDigits } from "@/lib/format";
import { Badge, PageTitle, ServiceChips } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminRequests({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireMainAdmin();
  const { status, q } = await searchParams;
  const conds: SQL[] = [];
  if (status) conds.push(eq(serviceRequests.status, status));
  if (q) {
    const like = `%${q}%`;
    const c = or(ilike(serviceRequests.carModel, like), ilike(users.name, like), ilike(users.phone, like));
    if (c) conds.push(c);
  }
  const rows = await db
    .select({
      r: serviceRequests,
      customer: users.name,
      phone: users.phone,
      offerCount: sql<number>`(select count(*)::int from ${offers} where ${offers.requestId}=${serviceRequests.id})`,
      minPrice: sql<number | null>`(select min(price) from ${offers} where ${offers.requestId}=${serviceRequests.id} and status in ('pending','accepted'))`,
      unread: sql<number>`(select count(*)::int from ${messages} where ${messages.requestId}=${serviceRequests.id} and read_by_admin=false)`,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(serviceRequests.createdAt))
    .limit(200);

  return (
    <div>
      <PageTitle title="سفارشات و درخواست‌ها" subtitle={`${toFaDigits(rows.length)} مورد`} />
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1">
          <label className="label">جستجو</label>
          <input name="q" defaultValue={q} className="input" placeholder="مدل خودرو، نام یا شماره مشتری" />
        </div>
        <div className="min-w-[160px]">
          <label className="label">وضعیت</label>
          <select name="status" defaultValue={status ?? ""} className="input">
            <option value="">همه</option>
            {Object.entries(REQUEST_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-dark">اعمال</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr className="text-right">
              <th className="p-3">کد</th>
              <th className="p-3">خودرو / خدمات</th>
              <th className="p-3">مشتری</th>
              <th className="p-3">شهر</th>
              <th className="p-3">پیشنهادها</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3">ثبت</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, customer, phone, offerCount, minPrice, unread }) => (
              <tr key={r.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                <td className="p-3">
                  <Link href={`/admin/requests/${r.id}`} className="font-bold text-brand-600">
                    #{toFaDigits(r.id)}
                  </Link>
                  {unread > 0 && <span className="badge mr-1 bg-brand-500 text-white">💬 {toFaDigits(unread)}</span>}
                </td>
                <td className="p-3">
                  <div className="font-semibold">{r.carModel}</div>
                  <div className="mt-1">
                    <ServiceChips services={r.services} />
                  </div>
                </td>
                <td className="p-3">
                  <div>{customer}</div>
                  <div className="text-xs text-slate-500" dir="ltr">
                    {phone}
                  </div>
                </td>
                <td className="p-3">{r.city}</td>
                <td className="p-3">
                  {toFaDigits(offerCount)}
                  {minPrice && (
                    <div className="text-xs text-slate-500">از {new Intl.NumberFormat("fa-IR").format(Number(minPrice))}</div>
                  )}
                </td>
                <td className="p-3">
                  <Badge map={REQUEST_STATUS} value={r.status} />
                </td>
                <td className="p-3 text-xs text-slate-500">{timeAgo(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-slate-400">موردی یافت نشد.</p>}
      </div>
    </div>
  );
}
