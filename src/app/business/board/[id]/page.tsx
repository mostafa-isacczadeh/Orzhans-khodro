import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, offers, requestMedia, serviceRequests, users } from "@/db/schema";
import { getOwnGarage, requireRole } from "@/lib/auth";
import { canViewRequest } from "@/lib/queries";
import { BOOKING_STATUS, OFFER_STATUS, REQUEST_STATUS } from "@/lib/constants";
import { formatDate, formatToman, toFaDigits } from "@/lib/format";
import { Badge, Notice, ServiceChips } from "@/components/ui";
import { BookingBox, MediaGallery } from "@/components/shared";
import OfferForm from "@/components/forms/OfferForm";
import { SubmitButton } from "@/components/forms/common";
import { withdrawOfferAction } from "@/app/actions/business";

export const dynamic = "force-dynamic";

export default async function BoardRequest({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("business", "admin");
  const garage = await getOwnGarage(user.id);
  if (!garage) redirect("/business/garage?new=1");
  const { id } = await params;
  const rid = Number(id);
  if (!(await canViewRequest(user, rid))) notFound();

  const [row] = await db
    .select({ r: serviceRequests, customerName: users.name })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .where(eq(serviceRequests.id, rid))
    .limit(1);
  if (!row) notFound();
  const req = row.r;
  const media = await db.select().from(requestMedia).where(eq(requestMedia.requestId, rid)).orderBy(asc(requestMedia.id));
  // Only this garage's own offer — never competitors'
  const [myOffer] = await db
    .select()
    .from(offers)
    .where(and(eq(offers.requestId, rid), eq(offers.garageId, garage.id)))
    .limit(1);
  const [booking] = myOffer?.status === "accepted"
    ? await db.select().from(bookings).where(eq(bookings.requestId, rid)).limit(1)
    : [undefined];

  const canOffer = req.status === "open" && garage.status !== "suspended" && req.customerId !== user.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/business/board" className="text-sm text-slate-500 hover:text-slate-800">
        → بازگشت به تابلو
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-extrabold">{req.carModel}</h1>
                <p className="text-sm text-slate-500">
                  {[req.carYear && `مدل ${req.carYear}`, req.carColor, req.city].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Badge map={REQUEST_STATUS} value={req.status} />
            </div>
            <div className="mt-3">
              <ServiceChips services={req.services} />
            </div>
            <div className="mt-3 text-xs text-slate-500">
              مشتری: {row.customerName.split(" ")[0]} · کد {toFaDigits(req.id)} · {formatDate(req.createdAt)}
            </div>
            {req.description && (
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-700">
                {req.description}
              </p>
            )}
          </div>
          <div className="card p-5">
            <h2 className="mb-3 font-bold">📸 عکس‌ها و فیلم‌های خودرو</h2>
            <MediaGallery media={media} />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {myOffer?.status === "accepted" && booking && (
            <div className="card space-y-3 p-5 ring-2 ring-emerald-400">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">🎉 مشتری پیشنهاد شما را پذیرفت</h2>
                <Badge map={BOOKING_STATUS} value={booking.status} />
              </div>
              <BookingBox scheduledAt={booking.scheduledAt} />
              <Notice>هماهنگی با مشتری از طریق پشتیبانی اورژانس خودرو انجام می‌شود.</Notice>
              <Link href="/business/jobs" className="btn-dark w-full">
                مدیریت نوبت
              </Link>
            </div>
          )}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">💰 پیشنهاد قیمت شما</h2>
              {myOffer && <Badge map={OFFER_STATUS} value={myOffer.status} />}
            </div>
            {canOffer && (!myOffer || myOffer.status === "pending" || myOffer.status === "withdrawn") ? (
              <>
                <OfferForm
                  requestId={req.id}
                  existing={
                    myOffer
                      ? {
                          price: myOffer.price,
                          estimatedDays: myOffer.estimatedDays,
                          availableAfterDays: myOffer.availableAfterDays,
                          availableDates: myOffer.availableDates ?? [],
                        }
                      : null
                  }
                />
                {myOffer?.status === "pending" && (
                  <form action={withdrawOfferAction} className="mt-3">
                    <input type="hidden" name="offerId" value={myOffer.id} />
                    <SubmitButton className="btn-danger w-full" confirm="پیشنهاد خود را پس می‌گیرید؟">
                      پس گرفتن پیشنهاد
                    </SubmitButton>
                  </form>
                )}
              </>
            ) : myOffer ? (
              <div className="space-y-2 text-sm">
                <div className="text-2xl font-black">{formatToman(myOffer.price)}</div>
                <div>📅 تاریخ‌های آزاد: {myOffer.availableDates?.length ? myOffer.availableDates.map((d) => formatDate(new Date(d + "T12:00:00Z"))).join("، ") : `${toFaDigits(myOffer.availableAfterDays)} روز دیگر`}</div>
                <div>⏱ مدت انجام تعمیر: {toFaDigits(myOffer.estimatedDays)} روز</div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {req.customerId === user.id ? "این درخواست متعلق به خودتان است." : "این درخواست دیگر پذیرای پیشنهاد نیست."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
