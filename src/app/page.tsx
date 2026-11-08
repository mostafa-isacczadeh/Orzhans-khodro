import Link from "next/link";
import { SERVICES } from "@/lib/constants";
import { getTopGarages } from "@/lib/queries";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { ServiceChips, Stars } from "@/components/ui";
import { toFaDigits } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, top] = await Promise.all([getCurrentUser(), getTopGarages(6)]);
  const cta = user ? (user.role === "customer" ? "/requests/new" : homeFor(user.role, user.phone)) : "/login";

  return (
    <div>
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url(/images/hero.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-ink-900 via-ink-900/80 to-ink-900/30" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <span className="badge bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/40">برآورد هزینه و رزرو نوبت</span>
          <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight md:text-5xl md:leading-tight">
            عکس خودروت رو بفرست،
            <br />
            <span className="text-brand-400">از بهترین تعمیرگاه‌ها قیمت بگیر</span>
          </h1>
          <p className="mt-5 max-w-xl text-slate-300 md:text-lg">
            صافکاری، نقاشی، دیتیلینگ و جوش پلاستیک. چند عکس و یک فیلم کوتاه بارگذاری کنید؛ تعمیرگاه‌های تأییدشده
            جداگانه قیمت می‌دهند، شما مقایسه می‌کنید و آنلاین نوبت می‌گیرید.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={cta} className="btn-primary !px-6 !py-3.5 text-base">
              {user && user.role !== "customer" ? "ورود به پنل" : "برآورد حدودی هزینه و رزرو نوبت"}
            </Link>
            <Link href="/garages" className="btn border border-white/20 !px-6 !py-3.5 text-base text-white hover:bg-white/10">
              مشاهده تعمیرگاه‌ها
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300">
            <span>✅ بدون هزینه ارزیابی</span>
            <span>🔒 حریم خصوصی کامل</span>
            <span>⭐ امتیاز واقعی مشتریان</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-extrabold">خدمات ما</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div key={s.key} className="card p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-3xl">{s.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{s.label}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-extrabold">چطور کار می‌کند؟</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["📱", "ورود با شماره موبایل", "با شماره موبایل و رمز عبور وارد حساب خود شوید."],
              ["📸", "ارسال عکس و فیلم", "از آسیب‌دیدگی عکس و ویدیوی کوتاه بگیرید."],
              ["💰", "دریافت پیشنهادهای جداگانه", "هر تعمیرگاه مستقل و محرمانه قیمت می‌دهد."],
              ["📅", "انتخاب و رزرو نوبت", "بهترین پیشنهاد را انتخاب و زمان مراجعه را رزرو کنید."],
            ].map(([i, t, d], idx) => (
              <div key={t} className="relative text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ink-900 text-2xl">{i}</div>
                <div className="absolute right-[calc(50%-44px)] top-0 grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  {toFaDigits(idx + 1)}
                </div>
                <h3 className="mt-4 font-bold">{t}</h3>
                <p className="mt-1 text-sm text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {top.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-extrabold">تعمیرگاه‌های برتر</h2>
            <Link href="/garages" className="text-sm font-semibold text-brand-600">
              همه تعمیرگاه‌ها ←
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((g) => (
              <Link key={g.id} href={`/garages/${g.id}`} className="card p-5 transition hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold">{g.name}</div>
                    <div className="text-xs text-slate-500">
                      📍 {g.city}
                      {g.district && ` · ${g.district}`}
                    </div>
                  </div>
                  <Stars value={g.stats.avg} />
                </div>
                <div className="mt-3">
                  <ServiceChips services={g.services} />
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {toFaDigits(g.stats.count)} نظر · {toFaDigits(g.stats.completed)} کار تکمیل‌شده
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-l from-brand-600 to-brand-500 p-8 text-white md:flex-row">
          <div>
            <h3 className="text-xl font-extrabold">صاحب تعمیرگاه هستید؟</h3>
            <p className="mt-1 text-brand-50">
              گاراژ خود را ثبت کنید و هر روز درخواست‌های جدید مشتریان شهرتان را دریافت کنید.
            </p>
          </div>
          <Link href="/login" className="btn bg-white !px-6 !py-3 text-brand-700 hover:bg-brand-50">
            ثبت رایگان تعمیرگاه
          </Link>
        </div>
      </section>
    </div>
  );
}
