import Link from "next/link";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { HOME_HERO_IMAGE, HOME_MAP_IMAGE } from "@/lib/home-assets";

export const dynamic = "force-dynamic";

function BellIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5c-7 0-12 6-12 14v7c0 4-2 7-5 10h34c-3-3-5-6-5-10v-7c0-8-5-14-12-14Z" /><path d="M19 41c1 3 3 4 5 4s4-1 5-4" /></svg>;
}
function UserIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="8" /><path d="M9 40c1-9 7-14 15-14s14 5 15 14" /></svg>;
}
function HomeIcon({ type }: { type: string }) {
  if (type === "home") return <svg viewBox="0 0 48 48"><path d="M4 22 24 5l20 17v21H29V29H19v14H4Z" /></svg>;
  if (type === "car") return <svg viewBox="0 0 48 48"><path d="m8 27 4-12c1-3 3-5 6-5h12c3 0 5 2 6 5l4 12 3 4v9h-6v-5H11v5H5v-9Zm5-1h22l-3-10H16Zm1 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm20 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>;
  if (type === "orders") return <svg viewBox="0 0 48 48"><path d="M12 5h18l8 8v30H12Z" /><path d="M29 5v10h9M18 23h14M18 30h14M18 37h9" /></svg>;
  return <svg viewBox="0 0 48 48"><path d="m20 4 8 0 2 6 5 2 6-3 5 7-4 5 1 6 5 4-3 8-7-1-5 4-1 6h-8l-2-6-5-2-6 3-5-7 4-5-1-6-5-4 3-8 7 1 5-4Z" /><circle cx="24" cy="25" r="7" /></svg>;
}

export default async function Home() {
  const user = await getCurrentUser();
  const cta = user ? (user.role === "customer" ? "/requests/new" : homeFor(user.role, user.phone)) : "/login";
  const notificationHref = !user ? "/login" : user.role === "admin" && user.phone === process.env.ADMIN_PHONE ? "/admin" : "/requests";
  const notificationLabel = !user ? "ورود برای مشاهده اعلان‌ها" : user.role === "admin" && user.phone === process.env.ADMIN_PHONE ? "پنل مدیریت کل" : user.role === "business" ? "درخواست‌های جدید برای ارزیابی قیمت" : "پیگیری سفارش‌های من";
  const notificationBadge = !user ? "ورود" : user.role === "admin" ? "مدیریت" : user.role === "business" ? "درخواست" : "سفارش";
  return (
    <div className="home-screen">
      <div className="home-shell">
        <header className="home-header">
          <Link href="/login" className="home-account">
            <span className="home-user-icon"><UserIcon /></span>
            <span>ورود / ثبت‌نام</span>
          </Link>
          <Link href="/" className="home-brand" aria-label="اورژانس خودرو">
            <div className="home-brand-mark"><svg viewBox="0 0 360 72" aria-hidden="true"><path d="M18 48c20-8 40-14 65-16 18-2 28-1 44 0 34-25 70-28 106-24 30 3 55 16 82 20l27 4-18 8c-21-2-43-7-63-14-42-15-89-12-126 10-30-2-56-1-79 8-14 5-24 9-38 8Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/><path d="M305 8c-8-7-20-8-29-1-9 8-8 21 0 29l-34 28 8 8 31-34c9 5 20 3 26-5 6-8 5-19-2-25l-11 13-10-3-2-11Z" fill="currentColor"/></svg></div>
            <strong>اورژانس خودرو</strong>
            <small>سریع · مطمئن · حرفه‌ای</small>
          </Link>
          <Link href="/requests" className="home-notifications" aria-label="اعلان‌ها">
            <BellIcon /><b>۲</b>
          </Link>
        </header>

        <section className="home-hero">
          <div className="home-hero-photo" style={{ backgroundImage: `url("${HOME_HERO_IMAGE}")` }} />
          <div className="home-hero-shade" />
          <div className="home-hero-copy">
            <h1>از تصادف تا<br /><em>مثل روز اول!</em></h1>
            <div className="hero-underline" />
            <ul>
              <li><span>✓</span> تعمیرات تخصصی بدنه</li>
              <li><span>✓</span> رنگ‌آمیزی با کیفیت</li>
              <li><span>✓</span> تحویل به‌موقع</li>
            </ul>
          </div>
        </section>

        <Link href={cta} className="home-main-cta">
          <span className="cta-symbols"><span>▦</span><i /> <span>▣</span></span>
          <strong>{user && user.role !== "customer" ? "ورود به پنل مدیریت" : "برآورد حدودی هزینه و رزرو نوبت"}</strong>
          <span className="cta-arrow">‹</span>
        </Link>

        <section className="home-info-grid">
          <a className="home-info-card contact-card" href="tel:09046047979">
            <div className="info-title"><span className="info-icon">☎</span><span>تماس با ما</span></div>
            <strong dir="ltr">09046047979</strong>
          </a>
          <a className="home-info-card location-card" href="https://maps.google.com/?q=Qom%2C+Valiasr+Square" target="_blank" rel="noreferrer">
            <div className="location-copy">
              <div className="info-title"><span className="info-icon">●</span><span>مکان تعمیرگاه</span></div>
              <strong>قم، میدان ولیعصر، ابتدای کوچه ۲</strong>
            </div>
            <img src={HOME_MAP_IMAGE} alt="نقشه شماتیک مکان تعمیرگاه در میدان ولیعصر قم" />
          </a>
        </section>

        <nav className="home-bottom-nav" aria-label="ناوبری اصلی">
          <Link href="/" className="active"><HomeIcon type="home" /><span>خانه</span></Link>
          <Link href="/requests"><HomeIcon type="car" /><span>خودروهای من</span></Link>
          <Link href="/requests"><HomeIcon type="orders" /><span>سفارش‌ها</span></Link>
          <Link href="/dashboard"><HomeIcon type="settings" /><span>تنظیمات</span></Link>
        </nav>
      </div>
    </div>
  );
}
