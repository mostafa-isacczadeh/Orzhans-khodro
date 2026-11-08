"use client";

import { useActionState, useState } from "react";
import { acceptOfferAction } from "@/app/actions/customer";
import type { SimpleState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "./common";

function fallbackDates(minDays: number) {
  const out: string[] = [];
  for (let i = Math.max(1, minDays); i <= Math.max(1, minDays) + 45 && out.length < 15; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const value = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    const weekday = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", weekday: "long" }).format(d);
    if (weekday !== "جمعه") out.push(value);
  }
  return formatAvailableDates(out);
}

function formatAvailableDates(values: string[]) {
  return values.map((value) => {
    const d = new Date(value + "T12:00:00Z");
    const fmt = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: "Asia/Tehran", ...options }).format(d);
    return { value, weekday: fmt({ weekday: "long" }), day: fmt({ day: "numeric" }), month: fmt({ month: "long" }) };
  }).filter((d) => d.weekday !== "جمعه");
}

export default function AcceptOfferForm({
  offerId,
  garageName,
  availableAfterDays,
  availableDates = [],
}: {
  offerId: number;
  garageName: string;
  availableAfterDays: number;
  availableDates?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<SimpleState, FormData>(acceptOfferAction, {});
  const [date, setDate] = useState("");
  const dates = availableDates.length ? formatAvailableDates(availableDates) : fallbackDates(availableAfterDays);

  if (!open)
    return <button onClick={() => setOpen(true)} className="btn-primary w-full">انتخاب این پیشنهاد و رزرو نوبت</button>;

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="date" value={date} />
      <div className="text-sm font-bold">انتخاب تاریخ مراجعه در «{garageName}»</div>
      {dates.length > 0 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {dates.map((d) => (
            <button type="button" key={d.value} onClick={() => setDate(d.value)}
              className={`min-w-[72px] shrink-0 rounded-xl border px-2 py-2 text-center text-xs transition ${
                date === d.value ? "border-brand-500 bg-brand-500 text-white" : "border-slate-200 bg-white hover:border-brand-300"
              }`}>
              <div>{d.weekday}</div><div className="text-lg font-extrabold">{d.day}</div><div>{d.month}</div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500"></p>
      )}
      {!date && <p className="text-xs text-slate-500">برای ادامه، یک تاریخ انتخاب کنید.</p>}
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton className="btn-primary flex-1">تأیید و رزرو</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">انصراف</button>
      </div>
    </form>
  );
}
