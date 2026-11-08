import Link from "next/link";
import { requireMainAdmin, requireRole, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Section = {
  icon: string;
  title: string;
  description: string;
  href?: string;
};

function SectionList({ title, subtitle, sections }: {
  title: string;
  subtitle: string;
  sections: Section[];
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-7">
        <p className="text-sm font-semibold text-brand-600">اورژانس خودرو</p>
        <h1 className="mt-2 text-2xl font-black text-ink-900">{title}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => {
          const content = (
            <>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">
                {section.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-ink-900">{section.title}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-500">{section.description}</span>
                {!section.href && (
                  <span className="mt-2 inline-block text-xs font-semibold text-amber-700">در حال آماده‌سازی</span>
                )}
              </span>
              {section.href && <span className="text-xl text-brand-600" aria-hidden="true">‹</span>}
            </>
          );

          return section.href ? (
            <Link
              key={section.title}
              href={section.href}
              className="card flex min-h-28 items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              {content}
            </Link>
          ) : (
            <div key={section.title} aria-disabled="true" className="card flex min-h-28 items-center gap-4 p-4 opacity-75">
              {content}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">
        برای بازگشت به صفحه اصلی، <Link href="/" className="font-semibold text-brand-600">اینجا را انتخاب کنید</Link>.
      </p>
    </div>
  );
}

export default async function WorkspacePage() {
  const user = await requireUser();

  if (user.role === "admin") {
    await requireMainAdmin();
    return (
      <SectionList
        title="فضای مدیریت کل"
        subtitle="بخش‌های مدیریتی سامانه در یکجا قرار دارند."
        sections={[
          { icon: "📊", title: "داشبورد و آمار کلی", description: "نمای کلی فعالیت‌ها و وضعیت سامانه", href: "/admin" },
          { icon: "📋", title: "مدیریت سفارش‌ها", description: "مشاهده و پیگیری درخواست‌ها و رزروها", href: "/admin/requests" },
          { icon: "👥", title: "مدیریت مشتریان", description: "مشاهده اطلاعات و سوابق کاربران", href: "/admin/users" },
          { icon: "🏭", title: "مدیریت تعمیرگاه‌ها", description: "بررسی، تأیید و تعلیق تعمیرگاه‌ها", href: "/admin/garages" },
          { icon: "🛡️", title: "مدیریت مدیران", description: "مدیریت نقش‌های مدیریتی از بخش کاربران", href: "/admin/users" },
          { icon: "📈", title: "گزارش‌ها", description: "آمار سفارش‌ها، درآمد و عملکرد سامانه", href: "/admin" },
          { icon: "⚙️", title: "تنظیمات سامانه", description: "مدیریت تنظیمات و متن‌های عمومی سامانه" },
        ]}
      />
    );
  }

  if (user.role === "business") {
    await requireRole("business");
    return (
      <SectionList
        title="فضای اختصاصی تعمیرگاه"
        subtitle="درخواست‌ها، پیشنهادها، رزروها و اطلاعات تعمیرگاه خود را مدیریت کنید."
        sections={[
          { icon: "📊", title: "داشبورد تعمیرگاه", description: "خلاصه درخواست‌ها، پیشنهادها و رزروهای شما", href: "/business" },
          { icon: "🔎", title: "درخواست‌های قیمت‌گیری", description: "بررسی درخواست مشتریان و ثبت پیشنهاد قیمت", href: "/business/board" },
          { icon: "💰", title: "پیشنهادهای من", description: "مشاهده و پیگیری پیشنهادهای ثبت‌شده", href: "/business" },
          { icon: "📅", title: "رزروها", description: "مشاهده نوبت‌های پذیرفته‌شده و به‌روزرسانی وضعیت کار", href: "/business/jobs" },
          { icon: "🧾", title: "سوابق کاری", description: "مشاهده سفارش‌ها و کارهای انجام‌شده", href: "/business/jobs" },
          { icon: "🏪", title: "پروفایل تعمیرگاه", description: "ویرایش مشخصات، شهر و محدوده فعالیت تعمیرگاه", href: "/business/garage" },
        ]}
      />
    );
  }

  await requireRole("customer");
  return (
    <SectionList
      title="فضای شخصی مشتری"
      subtitle="درخواست ارزیابی، پیشنهادهای تعمیرگاه‌ها و سفارش‌های خود را پیگیری کنید."
      sections={[
        { icon: "📊", title: "داشبورد من", description: "نمای کلی درخواست‌ها و آخرین وضعیت سفارش‌ها", href: "/requests" },
        { icon: "📸", title: "ثبت درخواست ارزیابی", description: "ثبت مشخصات خودرو و ارسال تصاویر آسیب‌دیدگی", href: "/requests/new" },
        { icon: "💰", title: "پیشنهادهای دریافتی", description: "مشاهده پیشنهادهای قیمت در جزئیات هر درخواست", href: "/requests" },
        { icon: "📦", title: "پیگیری سفارش‌ها", description: "مشاهده وضعیت درخواست‌ها، رزروها و تاریخ مراجعه", href: "/requests" },
        { icon: "🚘", title: "خودروهای من", description: "مشاهده خودروهای ثبت‌شده در درخواست‌ها" },
        { icon: "👤", title: "حساب کاربری و تنظیمات", description: "مدیریت اطلاعات حساب کاربری" },
      ]}
    />
  );
}
