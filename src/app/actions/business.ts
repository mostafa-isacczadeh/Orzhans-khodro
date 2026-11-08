"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, garages, offers, serviceRequests } from "@/db/schema";
import { getOwnGarage, normalizePhone, requireRole } from "@/lib/auth";
import { SERVICES } from "@/lib/constants";
import type { SimpleState } from "./auth";

function toNum(v: FormDataEntryValue | null) {
  const s = normalizePhone(String(v ?? "")).replace(/\D/g, "");
  return s ? Number(s) : NaN;
}

export async function saveGarageAction(_: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await requireRole("business", "admin");
  const name = String(formData.get("name") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const district = String(formData.get("district") || "").trim();
  const validDistricts = ["شرق", "غرب", "شمال", "جنوب", "مرکز"];
  const address = String(formData.get("address") || "").trim();
  const phone = normalizePhone(String(formData.get("phone") || ""));
  const description = String(formData.get("description") || "").trim().slice(0, 2000);
  const workingHours = String(formData.get("workingHours") || "").trim();
  const experienceYears = toNum(formData.get("experienceYears")) || 0;
  const valid = SERVICES.map((s) => s.key as string);
  const services = formData.getAll("services").map(String).filter((s) => valid.includes(s));

  if (name.length < 2) return { error: "نام تعمیرگاه را وارد کنید" };
  if (!city) return { error: "شهر را انتخاب کنید" };
  if (!validDistricts.includes(district)) return { error: "یکی از محدوده‌های شرق، غرب، شمال، جنوب یا مرکز را انتخاب کنید" };
  if (services.length === 0) return { error: "حداقل یک خدمت را انتخاب کنید" };
  if (!address) return { error: "آدرس دقیق را وارد کنید (فقط برای مدیریت قابل مشاهده است)" };

  const existing = await getOwnGarage(user.id);
  const values = { name, city, district, address, phone, description, workingHours, experienceYears, services };
  if (existing) {
    await db.update(garages).set(values).where(eq(garages.id, existing.id));
  } else {
    await db.insert(garages).values({
      ...values,
      ownerId: user.id,
      status: user.role === "admin" ? "approved" : "pending",
    });
    revalidatePath("/business");
    redirect("/business");
  }
  revalidatePath("/business");
  return { ok: "اطلاعات تعمیرگاه ذخیره شد" };
}

export async function submitOfferAction(_: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await requireRole("business", "admin");
  const garage = await getOwnGarage(user.id);
  if (!garage) return { error: "ابتدا تعمیرگاه خود را ثبت کنید" };
  if (garage.status === "suspended") return { error: "فعالیت تعمیرگاه شما تعلیق شده است و امکان ثبت پیشنهاد ندارید" };
  const requestId = Number(formData.get("requestId"));
  const price = toNum(formData.get("price"));
  const availableAfterDays = toNum(formData.get("availableAfterDays"));
  const estimatedDays = toNum(formData.get("estimatedDays")) || 1;
  if (!Number.isInteger(availableAfterDays) || availableAfterDays < 0 || availableAfterDays > 365)
    return { error: "اولین روز آزاد پذیرش باید بین صفر تا ۳۶۵ روز باشد" };
  if (!Number.isInteger(estimatedDays) || estimatedDays < 1 || estimatedDays > 365)
    return { error: "مدت تعمیر باید بین ۱ تا ۳۶۵ روز باشد" };
  if (!(price >= 500000)) return { error: "مبلغ پیشنهادی معتبر نیست (حداقل ۵۰۰,۰۰۰ تومان)" };

  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, requestId)).limit(1);
  if (!req || req.status !== "open") return { error: "این درخواست دیگر پذیرای پیشنهاد نیست" };
  if (req.customerId === user.id) return { error: "نمی‌توانید به درخواست خودتان پیشنهاد دهید" };

  const [existing] = await db
    .select()
    .from(offers)
    .where(and(eq(offers.requestId, requestId), eq(offers.garageId, garage.id)))
    .limit(1);
  if (existing) {
    if (existing.status === "accepted" || existing.status === "rejected")
      return { error: "امکان ویرایش این پیشنهاد وجود ندارد" };
    await db
      .update(offers)
      .set({ price, availableAfterDays, estimatedDays, status: "pending", updatedAt: new Date() })
      .where(eq(offers.id, existing.id));
  } else {
    await db.insert(offers).values({ requestId, garageId: garage.id, price, availableAfterDays, estimatedDays });
  }
  revalidatePath(`/business/board/${requestId}`);
  revalidatePath(`/business/board`);
  return { ok: existing ? "پیشنهاد شما به‌روزرسانی شد" : "پیشنهاد شما برای مشتری ارسال شد" };
}

export async function withdrawOfferAction(formData: FormData) {
  const user = await requireRole("business", "admin");
  const garage = await getOwnGarage(user.id);
  if (!garage) return;
  const offerId = Number(formData.get("offerId"));
  const [o] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);
  if (!o || o.garageId !== garage.id || o.status !== "pending") return;
  await db.update(offers).set({ status: "withdrawn", updatedAt: new Date() }).where(eq(offers.id, offerId));
  revalidatePath(`/business/board/${o.requestId}`);
}

export async function updateJobStatusAction(formData: FormData) {
  const user = await requireRole("business", "admin");
  const garage = await getOwnGarage(user.id);
  const bookingId = Number(formData.get("bookingId"));
  const status = String(formData.get("status"));
  if (!["in_progress", "completed"].includes(status)) return;
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!b) return;
  if (user.role !== "admin" && (!garage || b.garageId !== garage.id)) return;
  if (b.status === "cancelled" || b.status === "completed") return;
  await db.update(bookings).set({ status }).where(eq(bookings.id, bookingId));
  await db.update(serviceRequests).set({ status }).where(eq(serviceRequests.id, b.requestId));
  revalidatePath("/business/jobs");
}
