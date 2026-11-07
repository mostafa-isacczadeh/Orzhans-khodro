import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, offers, serviceRequests, users } from "@/db/schema";
import { getOwnGarage, requireRole } from "@/lib/auth";
import { BOOKING_STATUS } from "@/lib/constants";
import { formatDateTime, formatToman, toFaDigits } from "@/lib/format";
import { Badge, Empty, PageTitle, ServiceChips } from "@/components/ui";
import { SubmitButton } from "@/components/forms/common";
import { updateJobStatusAction } from "@/app/actions/business";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await requireRole("business", "admin");
  const garage = await getOwnGarage(user.id);
  if (!garage) redirect("/business/garage?new=1");

  const rows = await db
    .select({ b: bookings, r: serviceRequests, price: offers.price, days: offers.estimatedDays, customerName: users.name })
    .from(bookings)
    .innerJoin(serviceRequests, eq(serviceRequests.id, bookings.requestId))
    .innerJoin(offers, eq(offers.id, bookings.offerId))
    .innerJoin(users, eq(users.id, bookings.customerId))
    .where(eq(bookings.garageId, garage.id))
    .orderBy(desc(bookings.scheduledAt));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle title="نوبت‌ها و سفارش‌های رزروشده" subtitle="وضعیت کار را به‌روز کنید تا مشتری و مدیریت در جریان باشند." />
      {rows.length === 0 ? (
        <Empty icon="📅" title="هنوز نوبتی رزرو نشده است">
          با ارسال پیشنهادهای رقابتی در تابلوی درخواست‌ها، مشتری جذب کنید.
        </Empty>
      ) : (
        <div className="space-y-4">
          {rows.map(({ b, r, price, days, customerName }) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/business/board/${r.id}`} className="font-bold hover:text-brand-600">
                    {r.carModel} {r.carYear && `(${r.carYear})`}
                  </Link>
                  <div className="text-xs text-slate-500">
                    مشتری: {customerName.split(" ")[0]} · کد {toFaDigits(r.id)}
                  </div>
                  <div className="mt-2">
                    <ServiceChips services={r.services} />
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-extrabold">{formatToman(price)}</div>
                  <div className="text-xs text-slate-500">{toFaDigits(days)} روز کاری</div>
                  <div className="mt-1">
                    <Badge map={BOOKING_STATUS} value={b.status} />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="text-sm">📅 {formatDateTime(b.scheduledAt)}</span>
                <form action={updateJobStatusAction} className="flex gap-2">
                  <input type="hidden" name="bookingId" value={b.id} />
                  {b.status === "scheduled" && (
                    <SubmitButton name="status" value="in_progress" className="btn-dark">
                      خودرو تحویل گرفته شد
                    </SubmitButton>
                  )}
                  {(b.status === "scheduled" || b.status === "in_progress") && (
                    <SubmitButton name="status" value="completed" className="btn-primary" confirm="کار تکمیل و خودرو تحویل مشتری شد؟">
                      اتمام و تحویل
                    </SubmitButton>
                  )}
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
