import "server-only";
import { and, eq, inArray, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { garages, reviews, bookings, offers, serviceRequests, type User } from "@/db/schema";
import { ADMIN_PHONE } from "@/lib/auth";

export type GarageStats = { avg: number; count: number; completed: number };

export async function getGarageStats(ids: number[]): Promise<Map<number, GarageStats>> {
  const map = new Map<number, GarageStats>();
  if (ids.length === 0) return map;
  const r = await db
    .select({
      garageId: reviews.garageId,
      avg: sql<string>`avg(${reviews.rating})`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(inArray(reviews.garageId, ids))
    .groupBy(reviews.garageId);
  const c = await db
    .select({ garageId: bookings.garageId, completed: sql<number>`count(*)::int` })
    .from(bookings)
    .where(and(inArray(bookings.garageId, ids), eq(bookings.status, "completed")))
    .groupBy(bookings.garageId);
  for (const id of ids) map.set(id, { avg: 0, count: 0, completed: 0 });
  for (const row of r) {
    const s = map.get(row.garageId)!;
    s.avg = Number(row.avg) || 0;
    s.count = row.count;
  }
  for (const row of c) map.get(row.garageId)!.completed = row.completed;
  return map;
}

export async function getTopGarages(limit = 6) {
  const list = await db
    .select({
      id: garages.id,
      name: garages.name,
      city: garages.city,
      district: garages.district,
      services: garages.services,
      description: garages.description,
      experienceYears: garages.experienceYears,
    })
    .from(garages)
    .where(eq(garages.status, "approved"))
    .orderBy(desc(garages.createdAt))
    .limit(100);
  const stats = await getGarageStats(list.map((g) => g.id));
  return list
    .map((g) => ({ ...g, stats: stats.get(g.id)! }))
    .sort((a, b) => b.stats.avg * 10 + b.stats.count - (a.stats.avg * 10 + a.stats.count))
    .slice(0, limit);
}

/** Can the user view request details/media? */
export async function canViewRequest(user: User, requestId: number): Promise<boolean> {
  if (user.role === "admin" && user.phone === ADMIN_PHONE) return true;
  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, requestId)).limit(1);
  if (!req) return false;
  if (req.customerId === user.id) return true;
  if (user.role === "business") {
    const [g] = await db.select().from(garages).where(eq(garages.ownerId, user.id)).limit(1);
    if (!g || g.status === "suspended") return false;
    if (req.status === "open") return true;
    const [o] = await db
      .select({ id: offers.id })
      .from(offers)
      .where(and(eq(offers.requestId, requestId), eq(offers.garageId, g.id)))
      .limit(1);
    return !!o;
  }
  return false;
}
