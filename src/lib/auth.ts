import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, garages, trustedDevices, type User } from "@/db/schema";

const COOKIE = "garage_session";

export const ADMIN_PHONE = normalizePhone(process.env.ADMIN_PHONE ?? "");

export function normalizePhone(input: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  let s = input
    .split("")
    .map((c) => {
      const i = fa.indexOf(c);
      if (i >= 0) return String(i);
      const j = ar.indexOf(c);
      if (j >= 0) return String(j);
      return c;
    })
    .join("")
    .replace(/[^\d+]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  else if (s.startsWith("9") && s.length === 10) s = "0" + s;
  return s;
}

export function isValidPhone(p: string) {
  return /^09\d{9}$/.test(p);
}

const TRUST_COOKIE = "garage_trusted_device";
const TRUST_DAYS = 180;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [algorithm, saltHex, hashHex] = stored.split("$");
    if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/i.test(saltHex) ||
        !/^[a-f0-9]{128}$/i.test(hashHex)) return false;

    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function registerTrustedDevice(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TRUST_DAYS * 86400000);

  await db.insert(trustedDevices).values({
    userId,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt,
  });

  const store = await cookies();
  store.set(TRUST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function isTrustedDevice(userId: number): Promise<boolean> {
  const store = await cookies();
  const token = store.get(TRUST_COOKIE)?.value;
  if (!token) return false;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const [device] = await db
    .select({ id: trustedDevices.id })
    .from(trustedDevices)
    .where(and(
      eq(trustedDevices.userId, userId),
      eq(trustedDevices.tokenHash, tokenHash),
      gt(trustedDevices.expiresAt, now)
    ))
    .limit(1);

  if (!device) return false;

  await db.update(trustedDevices)
    .set({ lastUsedAt: now })
    .where(eq(trustedDevices.id, device.id));

  return true;
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await db.insert(sessions).values({
    token: hashSessionToken(token),
    userId,
    expiresAt,
  });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;

  if (token) {
    await db.delete(sessions).where(
      eq(sessions.token, hashSessionToken(token))
    );
  }

  store.delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.token, tokenHash))
    .limit(1);

  const row = rows[0];

  if (!row) return null;

  if (row.session.expiresAt <= new Date() || row.user.isBlocked) {
    await db.delete(sessions).where(eq(sessions.token, tokenHash));
    return null;
  }

  return row.user;
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  if (!u.name) redirect("/onboarding");
  return u;
}

export async function requireRole(...roles: string[]): Promise<User> {
  const u = await requireUser();

  // مدیر فرعی با نقش admin مجوز خودکار مدیریتی یا کسب‌وکار ندارد.
  if (u.role === "admin" && u.phone !== ADMIN_PHONE) {
    redirect("/");
  }

  if (!roles.includes(u.role)) redirect("/dashboard");
  return u;
}

export async function requireMainAdmin(): Promise<User> {
  const u = await requireUser();

  if (u.role !== "admin" || u.phone !== ADMIN_PHONE) {
    redirect("/");
  }

  return u;
}

export async function getOwnGarage(userId: number) {
  const rows = await db.select().from(garages).where(eq(garages.ownerId, userId)).limit(1);
  return rows[0] ?? null;
}

export function homeFor(role: string, phone: string) {
  if (role === "admin") return phone === ADMIN_PHONE ? "/admin" : "/";
  if (role === "business") return "/business";
  return "/requests";
}
