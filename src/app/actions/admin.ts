"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, garages, offers, reviews, serviceRequests, users, sessions } from "@/db/schema";
import { requireMainAdmin, ADMIN_PHONE } from "@/lib/auth";

export async function setGarageStatusAction(formData: FormData) {
  await requireMainAdmin();
  const id = Number(formData.get("garageId"));
  const status = String(formData.get("status"));
  if (!["pending", "approved", "suspended"].includes(status)) return;
  await db.update(garages).set({ status }).where(eq(garages.id, id));
  revalidatePath("/admin/garages");
}

export async function setUserRoleAction(formData: FormData) {
  await requireMainAdmin();
  const id = Number(formData.get("userId"));
  const role = String(formData.get("role"));
  if (!["customer", "business"].includes(role)) return;
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u || u.phone === ADMIN_PHONE) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
  revalidatePath("/admin/users");
}

export async function toggleBlockAction(formData: FormData) {
  await requireMainAdmin();
  const id = Number(formData.get("userId"));
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u || u.phone === ADMIN_PHONE) return;
  await db.update(users).set({ isBlocked: !u.isBlocked }).where(eq(users.id, id));
  if (!u.isBlocked) await db.delete(sessions).where(eq(sessions.userId, id));
  revalidatePath("/admin/users");
}

export async function adminRequestAction(formData: FormData) {
  await requireMainAdmin();
  const id = Number(formData.get("requestId"));
  const op = String(formData.get("op"));
  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1);
  if (!req) return;

  if (op === "note") {
    await db
      .update(serviceRequests)
      .set({ adminNote: String(formData.get("note") || "").slice(0, 3000) })
      .where(eq(serviceRequests.id, id));
  } else if (op === "reschedule") {
    const date = String(formData.get("date") || "");
    const time = String(formData.get("time") || "");
    const d = new Date(`${date}T${time}:00+03:30`);
    if (!isNaN(d.getTime())) await db.update(bookings).set({ scheduledAt: d }).where(eq(bookings.requestId, id));
  } else if (["in_progress", "completed"].includes(op)) {
    await db.update(serviceRequests).set({ status: op }).where(eq(serviceRequests.id, id));
    await db.update(bookings).set({ status: op }).where(eq(bookings.requestId, id));
  } else if (op === "cancel") {
    await db.update(serviceRequests).set({ status: "cancelled" }).where(eq(serviceRequests.id, id));
    await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.requestId, id));
    await db
      .update(offers)
      .set({ status: "rejected" })
      .where(and(eq(offers.requestId, id), eq(offers.status, "pending")));
  } else if (op === "reopen") {
    // Cancel booking and put request back on the shared board
    await db.delete(bookings).where(eq(bookings.requestId, id));
    await db.update(offers).set({ status: "pending" }).where(eq(offers.requestId, id));
    await db.update(serviceRequests).set({ status: "open", acceptedOfferId: null }).where(eq(serviceRequests.id, id));
  }
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath(`/admin/requests`);
}

export async function deleteReviewAction(formData: FormData) {
  await requireMainAdmin();
  const id = Number(formData.get("reviewId"));
  await db.delete(reviews).where(eq(reviews.id, id));
  revalidatePath("/admin/reviews");
}
