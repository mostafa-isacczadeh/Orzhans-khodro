import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, ne, arrayContains, type SQL, sql } from "drizzle-orm";
import { db } from "@/db";
import { offers, requestMedia, serviceRequests } from "@/db/schema";
import { getOwnGarage, requireRole } from "@/lib/auth";
import { CITIES, OFFER_STATUS, SERVICES } from "@/lib/constants";
import { formatToman, toFaDigits } from "@/lib/format";
import { Badge, Empty, Notice, PageTitle } from "@/components/ui";
import { RequestCard } from "@/components/shared";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; service?: string; mine?: string }>;
}) {
  const user = await requireRole("business", "admin");
  const garage = await getOwnGarage(user.id);
  if (!garage) redirect("/business/garage?new=1");
  if (garage.status === "suspended")
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Notice tone="warn">فعالیت تعمیرگاه شما توسط مدیریت تعلیق شده است و دسترسی به درخواست‌ها امکان‌پذیر نیست.</Notice>
      </div>
    );

  const sp = await searchParams;
  const city = sp.city ?? garage.city;
  const conds: SQL[] = [eq(serviceRequests.status, "open"), ne(serviceRequests.customerId, user.id)];
  if (city && city !== "all") conds.push(eq(serviceRequests.city, city));
  if (sp.service) conds.push(arrayContains(serviceRequests.services, [sp.service]));

  const rows = await db
    .select({
      r: serviceRequests,
      myOffer: offers,
      offerCount: sql<number>`(select count(*)::int from ${offers} o2 where o2.request_id = ${serviceRequests.id} and o2.status = 'pending')`,
      mediaCount: sql<number>`(select count(*)::int from ${requestMedia} m where m.request_id = ${serviceRequests.id})`,
    })
    .from(serviceRequests)
    .leftJoin(offers, and(eq(offers.requestId, serviceRequests.id), eq(offers.garageId, garage.id)))
    .where(and(...conds))
    .orderBy(desc(serviceRequests.createdAt))
    .limit(100);

  const filtered = sp.mine === "no" ? rows.filter((x) => !x.myOffer) : sp.mine === "yes" ? rows.filter((x) => x.myOffer) : rows;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageTitle
        title="تابلوی مشترک درخواست‌ها"
        subtitle="درخواست‌های باز مشتریان را بررسی کنید و قیمت پیشنهادی خود را ثبت کنید. قیمت شما برای سایر تعمیرگاه‌ها قابل مشاهده نیست."
      />
      <form className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[130px] flex-1">
          <label className="label">شهر</label>
          <select name="city" defaultValue={city} className="input">
            <option value="all">همه شهرها</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[130px] flex-1">
          <label className="label">خدمت</label>
          <select name="service" defaultValue={sp.service ?? ""} className="input">
            <option value="">همه</option>
            {SERVICES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[130px] flex-1">
          <label className="label">وضعیت پیشنهاد من</label>
          <select name="mine" defaultValue={sp.mine ?? ""} className="input">
            <option value="">همه</option>
            <option value="no">هنوز پیشنهاد نداده‌ام</option>
            <option value="yes">پیشنهاد داده‌ام</option>
          </select>
        </div>
        <button className="btn-dark">فیلتر</button>
      </form>

      {filtered.length === 0 ? (
        <Empty icon="📭" title="درخواست بازی با این فیلتر وجود ندارد" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ r, myOffer, offerCount, mediaCount }) => (
            <RequestCard
              key={r.id}
              href={`/business/board/${r.id}`}
              r={r}
              extra={
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    📎 {toFaDigits(mediaCount)} فایل · 👥 {toFaDigits(offerCount)} پیشنهاد
                  </span>
                  {myOffer ? (
                    <span className="flex items-center gap-1">
                      <b className="text-slate-800">{formatToman(myOffer.price)}</b>
                      <Badge map={OFFER_STATUS} value={myOffer.status} />
                    </span>
                  ) : (
                    <span className="font-semibold text-brand-600">ثبت قیمت ←</span>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-400">
        <Link href="/business/jobs" className="hover:text-slate-600">
          مشاهده نوبت‌های رزروشده ←
        </Link>
      </p>
    </div>
  );
}
