import type { ReactNode } from "react";
import { toFaDigits } from "@/lib/format";

export function Badge({ map, value }: { map: Record<string, { label: string; cls: string }>; value: string }) {
  const m = map[value] ?? { label: value, cls: "bg-slate-100 text-slate-700" };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

export function Stars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "lg" }) {
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-1 ${size === "lg" ? "text-lg" : "text-sm"}`}>
      <span className="tracking-tighter text-amber-400" dir="ltr">
        {"★".repeat(full)}
        <span className="text-slate-300">{"★".repeat(5 - full)}</span>
      </span>
      {count !== undefined && (
        <span className="text-xs text-slate-500">
          {count > 0 ? `${toFaDigits(value.toFixed(1))} (${toFaDigits(count)} نظر)` : "بدون نظر"}
        </span>
      )}
    </span>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon = "📭", title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="text-4xl">{icon}</div>
      <div className="font-bold text-slate-800">{title}</div>
      {children && <div className="text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, tone = "slate" }: { label: string; value: string | number; icon: string; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    orange: "bg-brand-100 text-brand-700",
    green: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={`grid h-12 w-12 place-items-center rounded-xl text-xl ${tones[tone]}`}>{icon}</div>
      <div>
        <div className="text-2xl font-extrabold">{typeof value === "number" ? toFaDigits(value) : value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function ServiceChips({ services }: { services: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {services.map((s) => (
        <span key={s} className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">
          {serviceIcon(s)} {serviceName(s)}
        </span>
      ))}
    </div>
  );
}

const SV: Record<string, [string, string]> = {
  bodywork: ["🔨", "صافکاری"],
  paint: ["🎨", "نقاشی"],
  detailing: ["✨", "دیتیلینگ"],
  plastic: ["🔧", "جوش پلاستیک"],
};
function serviceIcon(k: string) {
  return SV[k]?.[0] ?? "";
}
function serviceName(k: string) {
  return SV[k]?.[1] ?? k;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "ok"; children: ReactNode }) {
  const cls =
    tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : tone === "ok"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-sky-200 bg-sky-50 text-sky-900";
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
