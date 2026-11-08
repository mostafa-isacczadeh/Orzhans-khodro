"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { bookings, offers, reviews, serviceRequests, garages } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import type { SimpleState } from "./auth";

function validTehranDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) &&
    d.toISOString().slice(0, 10) === value;
}

function minimumBookingDate(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + Math.max(1, days), 12))
    .toISOString().slice(0, 10);
}

export async function acceptOfferAction(_: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await requireUser();
  const offerId = Number(formData.get("offerId"));
  const date = String(formData.get("date") || "");

  if (!Number.isInteger(offerId) || offerId <= 0 || !validTehranDate(date)) {
    return { error: "لطفاً تاریخ مراجعه را انتخاب کنید" };
  }

  const [row] = await db
    .select({ offer: offers, req: serviceRequests, garage: garages })
    .from(offers)
    .innerJoin(serviceRequests, eq(serviceRequests.id, offers.requestId))
    .innerJoin(garages, eq(garages.id, offers.garageId))
    .where(eq(offers.id, offerId))
    .limit(1);

  if (!row) return { error: "پیشنهاد یافت نشد" };
  if (row.req.customerId !== user.id) return { error: "دسترسی غیرمجاز" };
  if (row.req.status !== "open") return { error: "برای این درخواست قبلاً رزرو انجام شده است" };
  if (row.offer.status !== "pending") return { error: "این پیشنهاد دیگر معتبر نیست" };
  if (row.garage.status === "suspended") return { error: "این تعمیرگاه در حال حاضر فعال نیست" };

  const minDate = minimumBookingDate(row.offer.availableAfterDays ?? 0);
  if (date < minDate) {
    return { error: "تاریخ انتخاب‌شده زودتر از اولین روز آزاد تعمیرگاه است" };
  }

  const weekday = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    timeZone: "Asia/Tehran",
  }).format(new Date(date + "T12:00:00Z"));
  if (weekday === "جمعه") return { error: "امکان انتخاب روز جمعه وجود ندارد" };

  // نیمه‌شب به وقت تهران؛ ساعت از مشتری دریافت نمی‌شود.
  const scheduledAt = new Date(date + "T00:00:00+03:30");

  try {
    await db.transaction(async (tx) => {
      const [requestUpdated] = await tx
        .update(serviceRequests)
        .set({ status: "booked", acceptedOfferId: offerId })
        .where(and(
          eq(serviceRequests.id, row.req.id),
          eq(serviceRequests.status, "open"),
        ))
        .returning({ id: serviceRequests.id });

      if (!requestUpdated) throw new Error("REQUEST_ALREADY_BOOKED");

      const [offerUpdated] = await tx
        .update(offers)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(and(
          eq(offers.id, offerId),
          eq(offers.status, "pending"),
        ))
        .returning({ id: offers.id });

      if (!offerUpdated) throw new Error("OFFER_NOT_PENDING");

      await tx
        .update(offers)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(and(
          eq(offers.requestId, row.req.id),
          ne(offers.id, offerId),
          eq(offers.status, "pending"),
        ));

      await tx.insert(bookings).values({
        requestId: row.req.id,
        offerId,
        garageId: row.offer.garageId,
        customerId: user.id,
        scheduledAt,
      });
    });
  } catch (error) {
    if (error instanceof Error &&
        (error.message === "REQUEST_ALREADY_BOOKED" || error.message === "OFFER_NOT_PENDING")) {
      return { error: "این درخواست هم‌زمان توسط رزرو دیگری ثبت شده است؛ صفحه را تازه‌سازی کنید." };
    }
    throw error;
  }

  revalidatePath(`/requests/${row.req.id}`);
  return { ok: "رزرو با موفقیت ثبت شد." };
}

export async function cancelRequestAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("requestId"));
  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1);
  if (!req || req.customerId !== user.id || req.status !== "open") return;
  await db.update(serviceRequests).set({ status: "cancelled" }).where(eq(serviceRequests.id, id));
  await db
    .update(offers)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(and(eq(offers.requestId, id), eq(offers.status, "pending")));
  revalidatePath(`/requests/${id}`);
  revalidatePath(`/requests`);
}

export async function reviewAction(_: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await requireUser();
  const bookingId = Number(formData.get("bookingId"));
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") || "").trim().slice(0, 1000);
  if (!(rating >= 1 && rating <= 5)) return { error: "لطفاً امتیاز (۱ تا ۵ ستاره) را انتخاب کنید" };
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!b || b.customerId !== user.id) return { error: "دسترسی غیرمجاز" };
  if (b.status !== "completed") return { error: "پس از تحویل خودرو می‌توانید امتیاز دهید" };
  const existing = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
  if (existing.length) return { error: "قبلاً برای این سفارش امتیاز ثبت کرده‌اید" };
  await db.insert(reviews).values({ bookingId, garageId: b.garageId, customerId: user.id, rating, comment });
  revalidatePath(`/requests/${b.requestId}`);
  revalidatePath(`/garages/${b.garageId}`);
  return { ok: "از ثبت نظر شما سپاسگزاریم!" };
}
