import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookings, garages, offers, requestMedia, reviews, serviceRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getGarageStats } from "@/lib/queries";
import { BOOKING_STATUS, OFFER_STATUS, REQUEST_STATUS } from "@/lib/constants";
import { formatDate, formatToman, toFaDigits } from "@/lib/format";
import { Badge, Notice, ServiceChips, Stars } from "@/components/ui";
import { BookingBox, MediaGallery, MessageThread } from "@/components/shared";
import AcceptOfferForm from "@/components/forms/AcceptOfferForm";
import ReviewForm from "@/components/forms/ReviewForm";
import { cancelRequestAction } from "@/app/actions/customer";
import { SubmitButton } from "@/components/forms/common";

export const dynamic = "force-dynamic";

export default async function RequestDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { created } = await searchParams;
  const rid = Number(id);
  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, rid)).limit(1);
  if (!req || req.customerId !== user.id) notFound();

  const media = await db.select().from(requestMedia).where(eq(requestMedia.requestId, rid)).orderBy(asc(requestMedia.id));
  // Only public garage fields — never phone or address
  const offerRows = await db
    .select({
      offer: offers,
      garage: {
        id: garages.id,
        name: garages.name,
        city: garages.city,
        district: garages.district,
        experienceYears: garages.experienceYears,
      },
    })
    .from(offers)
    .innerJoin(garages, eq(garages.id, offers.garageId))
    .where(and(eq(offers.requestId, rid), inArray(offers.status, ["pending", "accepted", "rejected"])))
    .orderBy(asc(offers.price));
  const stats = await getGarageStats(offerRows.map((o) => o.garage.id));
  const [booking] = await db.select().from(bookings).where(eq(bookings.requestId, rid)).limit(1);
  const [review] = booking
    ? await db.select().from(reviews).where(eq(reviews.bookingId, booking.id)).limit(1)
    : [undefined];
  const accepted = offerRows.find((o) => o.offer.status === "accepted");
  const visibleOffers = req.status === "open" ? offerRows.filter((o) => o.offer.status === "pending") : offerRows;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/requests" className="text-sm text-slate-500 hover:text-slate-800">
        → بازگشت به درخواست‌ها
      </Link>
      {created && (
        <div className="mt-4">
          <Notice tone="ok">
            ✅ درخواست شما ثبت و در تابلوی تعمیرگاه‌ها منتشر شد. به‌محض دریافت پیشنهاد، در همین صفحه نمایش داده
            می‌شود.
          </Notice>
        </div>
      )}
      <div className="mt-4 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-extrabold">{req.carModel}</h1>
                <p className="text-sm text-slate-500">
                  {[req.carYear, req.carColor, req.city].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Badge map={REQUEST_STATUS} value={req.status} />
            </div>
            <div className="mt-3">
              <ServiceChips services={req.services} />
            </div>
            {req.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{req.description}</p>}
            <p className="mt-3 text-xs text-slate-400">
              کد پیگیری: {toFaDigits(req.id)} · ثبت: {formatDate(req.createdAt)}
            </p>
            <div className="mt-4">
              <MediaGallery media={media} />
            </div>
            {req.status === "open" && (
              <form action={cancelRequestAction} className="mt-4">
                <input type="hidden" name="requestId" value={req.id} />
                <SubmitButton className="btn-danger w-full" confirm="آیا از لغو این درخواست مطمئن هستید؟">
                  لغو درخواست
                </SubmitButton>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {booking && accepted && (
            <div className="card space-y-3 border-brand-200 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">🧾 سفارش شما</h2>
                <Badge map={BOOKING_STATUS} value={booking.status} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/garages/${accepted.garage.id}`} className="font-bold text-brand-700 hover:underline">
                    {accepted.garage.name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    📍 {accepted.garage.city}
                    {accepted.garage.district && ` · ${accepted.garage.district}`}
                  </div>
                </div>
                <div className="text-lg font-extrabold">{formatToman(accepted.offer.price)}</div>
              </div>
              <BookingBox scheduledAt={booking.scheduledAt} />
              <Notice>
                🔒 آدرس دقیق و هماهنگی نهایی مراجعه توسط پشتیبانی اورژانس خودرو از طریق گفتگوی زیر یا تماس با شما انجام
                می‌شود.
              </Notice>
              {booking.status === "completed" && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-2 font-bold">⭐ امتیاز شما به این تعمیرگاه</h3>
                  {review ? (
                    <div>
                      <Stars value={review.rating} size="lg" />
                      {review.comment && <p className="mt-1 text-sm text-slate-600">{review.comment}</p>}
                    </div>
                  ) : (
                    <ReviewForm bookingId={booking.id} />
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-extrabold">
              پیشنهادهای قیمت {visibleOffers.length > 0 && <span className="text-brand-600">({toFaDigits(visibleOffers.length)})</span>}
            </h2>
            {visibleOffers.length === 0 ? (
              <div className="card p-8 text-center text-sm text-slate-500">
                {req.status === "open"
                  ? "⏳ تعمیرگاه‌ها در حال بررسی عکس‌ها و فیلم‌های شما هستند. پیشنهادها به‌زودی اینجا نمایش داده می‌شوند."
                  : "پیشنهادی وجود ندارد."}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleOffers.map(({ offer, garage }, idx) => {
                  const s = stats.get(garage.id)!;
                  return (
                    <div
                      key={offer.id}
                      className={`card p-5 ${offer.status === "accepted" ? "ring-2 ring-emerald-400" : ""} ${
                        offer.status === "rejected" ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/garages/${garage.id}`} className="font-bold hover:text-brand-600">
                              {garage.name}
                            </Link>
                            {idx === 0 && req.status === "open" && visibleOffers.length > 1 && (
                              <span className="badge bg-emerald-100 text-emerald-700">کمترین قیمت</span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            📍 {garage.city}
                            {garage.district && ` · ${garage.district}`}
                            {garage.experienceYears > 0 && ` · ${toFaDigits(garage.experienceYears)} سال سابقه`}
                          </div>
                          <div className="mt-1">
                            <Stars value={s.avg} count={s.count} />
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-xl font-black text-ink-900">{formatToman(offer.price)}</div>
                          {req.status !== "open" && <Badge map={OFFER_STATUS} value={offer.status} />}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>⏱ مدت کار: {toFaDigits(offer.estimatedDays)} روز</span>
                        <span>📅 اولین روز آزاد پذیرش: {toFaDigits(offer.availableAfterDays)} روز دیگر</span>
                        <span>✔️ {toFaDigits(s.completed)} کار موفق</span>
                      </div>
                      {req.status === "open" && offer.status === "pending" && (
                        <div className="mt-4">
                          <AcceptOfferForm offerId={offer.id} garageName={garage.name} availableAfterDays={offer.availableAfterDays} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <MessageThread
            requestId={req.id}
            participantId={user.id}
            viewerId={user.id}
            path={`/requests/${req.id}`}
            hint="سؤال، درخواست تغییر زمان یا هر مشکلی دارید، با پشتیبانی در میان بگذارید. پشتیبانی رابط شما و تعمیرگاه است."
          />
        </div>
      </div>
    </div>
  );
}
