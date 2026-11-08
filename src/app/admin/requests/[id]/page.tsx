import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, garages, offers, requestMedia, reviews, serviceRequests, users } from "@/db/schema";
import { requireMainAdmin } from "@/lib/auth";
import { BOOKING_STATUS, OFFER_STATUS, REQUEST_STATUS, TIME_SLOTS } from "@/lib/constants";
import { formatDate, formatToman, toFaDigits } from "@/lib/format";
import { Badge, ServiceChips, Stars } from "@/components/ui";
import { BookingBox, MediaGallery } from "@/components/shared";
import { SubmitButton } from "@/components/forms/common";
import { adminRequestAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireMainAdmin();
  const { id } = await params;
  const rid = Number(id);
  const [row] = await db
    .select({ r: serviceRequests, customer: users })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .where(eq(serviceRequests.id, rid))
    .limit(1);
  if (!row) notFound();
  const req = row.r;
  const media = await db.select().from(requestMedia).where(eq(requestMedia.requestId, rid)).orderBy(asc(requestMedia.id));
  const offerRows = await db
    .select({ o: offers, g: garages, ownerName: users.name, ownerPhone: users.phone })
    .from(offers)
    .innerJoin(garages, eq(garages.id, offers.garageId))
    .innerJoin(users, eq(users.id, garages.ownerId))
    .where(eq(offers.requestId, rid))
    .orderBy(asc(offers.price));
  const [booking] = await db.select().from(bookings).where(eq(bookings.requestId, rid)).limit(1);
  const [review] = booking ? await db.select().from(reviews).where(eq(reviews.bookingId, booking.id)).limit(1) : [undefined];
  const path = `/admin/requests/${rid}`;
  const scheduled = booking
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(booking.scheduledAt)
    : "";

  return (
    <div>
      <Link href="/admin/requests" className="text-sm text-slate-500 hover:text-slate-800">
        → بازگشت به لیست
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-extrabold">
                  #{toFaDigits(req.id)} · {req.carModel}
                </h1>
                <p className="text-sm text-slate-500">{[req.carYear, req.carColor, req.city].filter(Boolean).join(" · ")}</p>
              </div>
              <Badge map={REQUEST_STATUS} value={req.status} />
            </div>
            <div className="mt-3">
              <ServiceChips services={req.services} />
            </div>
            {req.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{req.description}</p>}
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
              <div className="font-semibold">👤 {row.customer.name}</div>
              <a href={`tel:${row.customer.phone}`} className="text-brand-600" dir="ltr">
                {row.customer.phone}
              </a>
              <div className="text-xs text-slate-500">ثبت: {formatDate(req.createdAt)}</div>
            </div>
            <div className="mt-4">
              <MediaGallery media={media} />
            </div>
          </div>

          <div className="card space-y-4 p-5">
            <h2 className="font-bold">⚙️ اقدامات مدیریتی</h2>
            <form action={adminRequestAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="requestId" value={req.id} />
              {(req.status === "booked") && (
                <SubmitButton name="op" value="in_progress" className="btn-dark">
                  شروع تعمیر
                </SubmitButton>
              )}
              {(req.status === "booked" || req.status === "in_progress") && (
                <SubmitButton name="op" value="completed" className="btn-primary">
                  تکمیل سفارش
                </SubmitButton>
              )}
              {(req.status === "booked" || req.status === "cancelled") && (
                <SubmitButton name="op" value="reopen" className="btn-ghost" confirm="رزرو حذف و درخواست دوباره در تابلو منتشر شود؟">
                  بازگشایی در تابلو
                </SubmitButton>
              )}
              {req.status !== "cancelled" && req.status !== "completed" && (
                <SubmitButton name="op" value="cancel" className="btn-danger" confirm="سفارش لغو شود؟">
                  لغو سفارش
                </SubmitButton>
              )}
            </form>
            {booking && booking.status !== "completed" && booking.status !== "cancelled" && (
              <form action={adminRequestAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="requestId" value={req.id} />
                <input type="hidden" name="op" value="reschedule" />
                <div>
                  <label className="label">تغییر تاریخ (میلادی)</label>
                  <input type="date" name="date" defaultValue={scheduled} className="input" />
                </div>
                <div>
                  <label className="label">ساعت</label>
                  <select name="time" className="input">
                    {TIME_SLOTS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <SubmitButton className="btn-ghost">ثبت زمان جدید</SubmitButton>
              </form>
            )}
            <form action={adminRequestAction} className="space-y-2">
              <input type="hidden" name="requestId" value={req.id} />
              <input type="hidden" name="op" value="note" />
              <label className="label">یادداشت داخلی (فقط مدیریت)</label>
              <textarea name="note" rows={3} defaultValue={req.adminNote} className="input" />
              <SubmitButton className="btn-ghost">ذخیره یادداشت</SubmitButton>
            </form>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {booking && (
            <div className="card space-y-3 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">🧾 رزرو</h2>
                <Badge map={BOOKING_STATUS} value={booking.status} />
              </div>
              <BookingBox scheduledAt={booking.scheduledAt} />
              {review && (
                <div className="rounded-xl bg-amber-50 p-3 text-sm">
                  <Stars value={review.rating} /> {review.comment}
                </div>
              )}
            </div>
          )}

          <div className="card p-5">
            <h2 className="mb-3 font-bold">💰 همه پیشنهادها ({toFaDigits(offerRows.length)})</h2>
            {offerRows.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">هنوز پیشنهادی ثبت نشده.</p>
            ) : (
              <div className="space-y-3">
                {offerRows.map(({ o, g, ownerName, ownerPhone }) => (
                  <div key={o.id} className={`rounded-xl border p-4 ${o.status === "accepted" ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link href={`/garages/${g.id}`} className="font-bold hover:text-brand-600">
                          {g.name}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {ownerName} · <span dir="ltr">{ownerPhone}</span>
                          {g.phone && (
                            <>
                              {" "}
                              · تلفن گاراژ: <span dir="ltr">{g.phone}</span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">📍 {g.city} · {g.address}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-extrabold">{formatToman(o.price)}</div>
                        <Badge map={OFFER_STATUS} value={o.status} />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      📅 روزهای آزاد: {o.availableDates?.length ? o.availableDates.map((d) => formatDate(new Date(d + "T12:00:00Z"))).join("، ") : `${toFaDigits(o.availableAfterDays)} روز دیگر`} · ⏱ تعمیر: {toFaDigits(o.estimatedDays)} روز
                    </div>
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
