"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { requireUser, ADMIN_PHONE } from "@/lib/auth";
import { canViewRequest } from "@/lib/queries";
import type { SimpleState } from "./auth";

export async function sendMessageAction(_: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await requireUser();
  const requestId = Number(formData.get("requestId"));
  const body = String(formData.get("body") || "").trim().slice(0, 2000);
  const path = String(formData.get("path") || "/");
  if (!body) return { error: "متن پیام خالی است" };
  let participantId = user.id;
  if (user.role === "admin" && user.phone === ADMIN_PHONE) {
    const p = Number(formData.get("participantId"));
    if (p && p !== user.id) participantId = p;
  }
  if (!(await canViewRequest(user, requestId))) return { error: "دسترسی غیرمجاز" };
  await db.insert(messages).values({
    requestId,
    participantId,
    senderId: user.id,
    body,
    readByAdmin: user.role === "admin" && user.phone === ADMIN_PHONE,
  });
  if (user.role === "admin" && user.phone === ADMIN_PHONE) {
    await db
      .update(messages)
      .set({ readByAdmin: true })
      .where(and(eq(messages.requestId, requestId), eq(messages.participantId, participantId)));
  }
  revalidatePath(path);
  return { ok: "ارسال شد" };
}
