import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { offers, serviceRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { Empty, PageTitle } from "@/components/ui";
import { RequestCard } from "@/components/shared";
import { toFaDigits } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyRequests() {
  const user = await requireUser();
  const list = await db
    .select({
      r: serviceRequests,
      offerCount: sql<number>`(select count(*)::int from ${offers} where ${offers.requestId} = ${serviceRequests.id} and ${offers.status} in ('pending','accepted'))`,
    })
    .from(serviceRequests)
    .where(eq(serviceRequests.customerId, user.id))
    .orderBy(desc(serviceRequests.createdAt));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle
        title="درخواست‌های من"
        subtitle="وضعیت ارزیابی‌ها، پیشنهادهای قیمت و نوبت‌های خود را اینجا ببینید."
        action={
          <Link href="/requests/new" className="btn-primary">
            + درخواست ارزیابی جدید
          </Link>
        }
      />
      {list.length === 0 ? (
        <Empty icon="🚘" title="هنوز درخواستی ثبت نکرده‌اید">
          <Link href="/requests/new" className="btn-primary mt-3">
            اولین ارزیابی رایگان
          </Link>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map(({ r, offerCount }) => (
            <RequestCard
              key={r.id}
              href={`/requests/${r.id}`}
              r={r}
              extra={
                <span className={`text-sm font-semibold ${offerCount > 0 ? "text-brand-600" : "text-slate-400"}`}>
                  {offerCount > 0 ? `💰 ${toFaDigits(offerCount)} پیشنهاد قیمت دریافت شده` : "⏳ منتظر پیشنهاد تعمیرگاه‌ها"}
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
