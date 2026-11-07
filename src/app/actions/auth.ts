"use server";

import { redirect } from "next/navigation";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes, users, garages, loginAttempts } from "@/db/schema";
import {
  ADMIN_PHONE,
  createSession,
  destroySession,
  getCurrentUser,
  homeFor,
  isValidPhone,
  normalizePhone,
  hashPassword,
  registerTrustedDevice,
  isTrustedDevice,
  verifyPassword,
} from "@/lib/auth";

export type OtpState = {
  step: "phone" | "code";
  phone?: string;
  error?: string;
};

function hashOtp(phone: string, code: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${phone}:${code}`)
    .digest("hex");
}

function verifyOtpHash(stored: string, expected: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(stored)) return false;
  const a = Buffer.from(stored, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function sendSms(phone: string, code: string): Promise<boolean> {
  const key = process.env.SMS_API_KEY;
  const template = process.env.SMS_TEMPLATE || "verify";
  if (!key) return false;

  try {
    const url = `https://api.kavenegar.com/v1/${key}/verify/lookup.json`;
    const body = new URLSearchParams({
      receptor: phone,
      token: code,
      template,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return false;

    const data = await res.json();
    return data?.return?.status === 200;
  } catch {
    return false;
  }
}

export async function otpAction(prev: OtpState, formData: FormData): Promise<OtpState> {
  const intent = String(formData.get("intent") || "");
  const phone = normalizePhone(String(formData.get("phone") || prev.phone || ""));

  if (intent === "send" || intent === "resend") {
    if (!isValidPhone(phone)) return { step: "phone", error: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷)" };
    const secret = process.env.OTP_SECRET;
    if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
      return { step: "phone", phone, error: "تنظیمات امنیتی ورود کامل نیست. با پشتیبانی تماس بگیرید." };
    }

    const code = String(randomInt(10000, 100000));
    const codeHash = hashOtp(phone, code, secret);

    const reserved = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${phone}))`);

      const [recent] = await tx
        .select({ id: otpCodes.id })
        .from(otpCodes)
        .where(
          and(
            eq(otpCodes.phone, phone),
            gt(otpCodes.createdAt, new Date(Date.now() - 60_000))
          )
        )
        .limit(1);

      if (recent) return false;

      await tx.delete(otpCodes).where(eq(otpCodes.phone, phone));
      await tx.insert(otpCodes).values({
        phone,
        code: codeHash,
        expiresAt: new Date(Date.now() + 5 * 60_000),
      });

      return true;
    });

    if (!reserved) {
      return {
        ...prev,
        step: "code",
        phone,
        error: "لطفاً یک دقیقه صبر کنید و دوباره تلاش کنید",
      };
    }

    const sent = await sendSms(phone, code);

    if (!sent) {
      return {
        step: "phone",
        phone,
        error: "ارسال پیامک ناموفق بود. لطفاً یک دقیقه بعد دوباره تلاش کنید.",
      };
    }

    return { step: "code", phone };
  }

  if (intent === "edit") return { step: "phone", phone };

  // verify
  const rawCode = String(formData.get("code") || "");
  const code = rawCode
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

  if (!/^\d{5}$/.test(code)) {
    return { ...prev, step: "code", phone, error: "کد تأیید باید دقیقاً ۵ رقم باشد" };
  }

  if (!isValidPhone(phone)) return { step: "phone", error: "شماره نامعتبر است" };
  const secret = process.env.OTP_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    return { ...prev, step: "phone", phone, error: "تنظیمات امنیتی ورود کامل نیست. با پشتیبانی تماس بگیرید." };
  }

  const [row] = await db
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.phone, phone))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!row || row.expiresAt < new Date()) {
    return { ...prev, step: "code", phone, error: "کد منقضی شده است. دوباره ارسال کنید" };
  }
  if (row.attempts >= 5) return { ...prev, step: "code", phone, error: "تعداد تلاش‌ها بیش از حد مجاز است" };
  if (!verifyOtpHash(row.code, hashOtp(phone, code, secret))) {
    const [updated] = await db
      .update(otpCodes)
      .set({ attempts: sql`${otpCodes.attempts} + 1` })
      .where(and(
        eq(otpCodes.id, row.id),
        lt(otpCodes.attempts, 5),
        gt(otpCodes.expiresAt, new Date())
      ))
      .returning({ attempts: otpCodes.attempts });

    if (!updated || updated.attempts >= 5) {
      return { ...prev, step: "code", phone, error: "تعداد تلاش‌ها به حد مجاز رسیده یا کد منقضی شده است" };
    }

    return { ...prev, step: "code", phone, error: "کد وارد شده صحیح نیست" };
  }

  const [consumed] = await db
    .delete(otpCodes)
    .where(and(
      eq(otpCodes.id, row.id),
      eq(otpCodes.code, row.code),
      lt(otpCodes.attempts, 5),
      gt(otpCodes.expiresAt, new Date())
    ))
    .returning({ id: otpCodes.id });

  if (!consumed) {
    return { ...prev, step: "phone", phone, error: "این کد قبلاً استفاده شده یا منقضی شده است. دوباره درخواست کد کنید." };
  }

  let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    [user] = await db
      .insert(users)
      .values({ phone, role: phone === ADMIN_PHONE ? "admin" : "customer" })
      .returning();
  } else if (phone === ADMIN_PHONE && user.role !== "admin") {
    [user] = await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id)).returning();
  }
  if (user.isBlocked) return { step: "phone", error: "حساب کاربری شما مسدود شده است. با پشتیبانی تماس بگیرید" };
  await createSession(user.id);
  if (!user.name) redirect("/onboarding");
  redirect(homeFor(user.role, user.phone));
}

export type SimpleState = { error?: string; ok?: string };



function loginPhoneHash(phone: string): string {
  const secret = process.env.OTP_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("OTP_SECRET is missing or too short");
  }
  return createHmac("sha256", secret)
    .update(`login-attempt:${phone}`)
    .digest("hex");
}

async function isLoginLocked(phoneHash: string): Promise<boolean> {
  const [row] = await db.select({ lockedUntil: loginAttempts.lockedUntil })
    .from(loginAttempts)
    .where(eq(loginAttempts.phoneHash, phoneHash))
    .limit(1);
  return Boolean(row?.lockedUntil && row.lockedUntil > new Date());
}

async function recordLoginFailure(phoneHash: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO login_attempts
      (phone_hash, failed_attempts, window_started_at, locked_until, updated_at)
    VALUES (${phoneHash}, 1, now(), NULL, now())
    ON CONFLICT (phone_hash) DO UPDATE SET
      failed_attempts = CASE
        WHEN login_attempts.window_started_at <= now() - interval '15 minutes'
        THEN 1 ELSE login_attempts.failed_attempts + 1
      END,
      window_started_at = CASE
        WHEN login_attempts.window_started_at <= now() - interval '15 minutes'
        THEN now() ELSE login_attempts.window_started_at
      END,
      locked_until = CASE
        WHEN (
          CASE
            WHEN login_attempts.window_started_at <= now() - interval '15 minutes'
            THEN 1 ELSE login_attempts.failed_attempts + 1
          END
        ) >= 5
        THEN now() + interval '15 minutes'
        ELSE NULL
      END,
      updated_at = now()
  `);
}

async function clearLoginFailures(phoneHash: string): Promise<void> {
  await db.delete(loginAttempts)
    .where(eq(loginAttempts.phoneHash, phoneHash));
}

export async function passwordLoginAction(
  _: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  const phone = normalizePhone(String(formData.get("phone") || ""));
  const password = String(formData.get("password") || "");

  if (!isValidPhone(phone)) {
    return { error: "شماره موبایل یا رمز عبور صحیح نیست." };
  }

  const phoneHash = loginPhoneHash(phone);

  if (password.length > 128) {
    if (!(await isLoginLocked(phoneHash))) {
      await recordLoginFailure(phoneHash);
    }
    return { error: "شماره موبایل یا رمز عبور صحیح نیست." };
  }

  if (phone === ADMIN_PHONE) {
    const [admin] = await db.select().from(users)
      .where(and(eq(users.phone, phone), eq(users.role, "admin")))
      .limit(1);

    if (!admin || admin.isBlocked) {
      return { error: "حساب مدیر کل هنوز راه‌اندازی نشده است." };
    }

    if (await isTrustedDevice(admin.id)) {
      await clearLoginFailures(phoneHash);
      await createSession(admin.id);
      redirect("/admin");
    }

    if (await isLoginLocked(phoneHash)) {
      return { error: "تعداد تلاش‌های ناموفق زیاد است. ۱۵ دقیقه دیگر دوباره تلاش کنید." };
    }

    if (!/^\d{5,128}$/.test(password) ||
        !admin.passwordHash || !verifyPassword(password, admin.passwordHash)) {
      await recordLoginFailure(phoneHash);
      return { error: "شماره موبایل یا رمز عبور صحیح نیست." };
    }

    await clearLoginFailures(phoneHash);
    await createSession(admin.id);
    await registerTrustedDevice(admin.id);
    redirect("/admin");
  }

  let [user] = await db.select().from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  if (user) {
    if (user.isBlocked) {
      return { error: "حساب کاربری شما مسدود است." };
    }

    const trusted = await isTrustedDevice(user.id);

    if (trusted) {
      await clearLoginFailures(phoneHash);
    }

    if (!trusted) {
      if (await isLoginLocked(phoneHash)) {
        return { error: "تعداد تلاش‌های ناموفق زیاد است. ۱۵ دقیقه دیگر دوباره تلاش کنید." };
      }

      if (!/^\d{3,5}$/.test(password) ||
          !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
        await recordLoginFailure(phoneHash);
        return { error: "شماره موبایل یا رمز عبور صحیح نیست." };
      }

      await clearLoginFailures(phoneHash);
      await registerTrustedDevice(user.id);
    }

    await createSession(user.id);

    if (!user.name) redirect("/onboarding");
    redirect(homeFor(user.role, user.phone));
  }

  if (await isLoginLocked(phoneHash)) {
    return { error: "تعداد تلاش‌های ناموفق زیاد است. ۱۵ دقیقه دیگر دوباره تلاش کنید." };
  }

  if (!/^\d{3,5}$/.test(password)) {
    await recordLoginFailure(phoneHash);
    return { error: "رمز عبور باید فقط شامل ۳ تا ۵ رقم انگلیسی باشد." };
  }

  const newUser = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${phone}))`);

    const [existing] = await tx.select().from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (existing) return null;

    const [created] = await tx.insert(users).values({
      phone,
      role: "customer",
      passwordHash: hashPassword(password),
    }).returning();

    return created ?? null;
  });

  if (!newUser) {
    await recordLoginFailure(phoneHash);
    return { error: "شماره موبایل یا رمز عبور صحیح نیست. دوباره تلاش کنید." };
  }

  await clearLoginFailures(phoneHash);
  await createSession(newUser.id);
  await registerTrustedDevice(newUser.id);
  redirect("/onboarding");
}

export async function onboardingAction(_: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "customer");
  if (name.length < 2) return { error: "لطفاً نام خود را وارد کنید" };
  const newRole = user.role === "admin" ? "admin" : role === "business" ? "business" : "customer";
  await db.update(users).set({ name, role: newRole }).where(eq(users.id, user.id));
  if (newRole === "business") {
    const [g] = await db.select({ id: garages.id }).from(garages).where(eq(garages.ownerId, user.id)).limit(1);
    if (!g) redirect("/business/garage?new=1");
  }
  redirect(homeFor(newRole, user.phone));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}


export async function adminSetupAction(
  _: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  const setupSecret = String(formData.get("setupSecret") || "");
  const configuredSecret = process.env.ADMIN_SETUP_SECRET || "";
  const password = String(formData.get("password") || "");

  if (!isValidPhone(ADMIN_PHONE)) {
    return { error: "تنظیمات شماره مدیر کل معتبر نیست." };
  }

  if (
    !configuredSecret ||
    Buffer.byteLength(configuredSecret, "utf8") < 32 ||
    Buffer.byteLength(setupSecret, "utf8") !== Buffer.byteLength(configuredSecret, "utf8") ||
    !timingSafeEqual(Buffer.from(setupSecret, "utf8"), Buffer.from(configuredSecret, "utf8"))
  ) {
    return { error: "کلید راه‌اندازی معتبر نیست." };
  }

  if (!/^\d{5,128}$/.test(password)) {
    return { error: "رمز مدیر کل باید حداقل ۵ رقم انگلیسی باشد." };
  }

  const passwordHash = hashPassword(password);

  const userId = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('main-admin-bootstrap'))`);

    const [mainAdmin] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phone, ADMIN_PHONE), eq(users.role, "admin")))
      .limit(1);

    if (mainAdmin) return null;

    const [existing] = await tx
      .select()
      .from(users)
      .where(eq(users.phone, ADMIN_PHONE))
      .limit(1);

    if (existing?.isBlocked) return null;

    if (existing) {
      const [updated] = await tx
        .update(users)
        .set({ role: "admin", passwordHash })
        .where(eq(users.id, existing.id))
        .returning({ id: users.id });

      return updated?.id ?? null;
    }

    const [created] = await tx
      .insert(users)
      .values({
        phone: ADMIN_PHONE,
        role: "admin",
        passwordHash,
      })
      .returning({ id: users.id });

    return created?.id ?? null;
  });

  if (!userId) {
    return { error: "راه‌اندازی قبلاً انجام شده یا امکان ساخت حساب وجود ندارد." };
  }

  await createSession(userId);
  await registerTrustedDevice(userId);
  redirect("/admin");
}
