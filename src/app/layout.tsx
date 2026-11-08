import type { Metadata, Viewport } from "next";
import ServiceWorkerRegister from './ServiceWorkerRegister';
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/Header";
import HeaderGate from "@/components/HeaderGate";

export const metadata: Metadata = {
  title: "اورژانس خودرو | سریع، مطمئن، حرفه‌ای",
  description:
    "برآورد حدودی هزینه و رزرو نوبت خدمات صافکاری و نقاشی خودرو.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ServiceWorkerRegister />
        <HeaderGate
          header={<Header />}
          footer={<footer className="mt-16 border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row"><p>© اورژانس خودرو — بازار آنلاین خدمات بدنه خودرو</p><p>صافکاری · نقاشی · دیتیلینگ · جوش پلاستیک</p></div></footer>}
        >
          <main>{children}</main>
        </HeaderGate>
      </body>
    </html>
  );
}
