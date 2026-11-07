"use client";

import { useActionState, useMemo, useState } from "react";
import { acceptOfferAction } from "@/app/actions/customer";
import type { SimpleState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "./common";

function nextDays(minDays: number) {
  const out: { value: string; weekday: string; day: string; month: string }[] = [];
  const start = Math.max(1, minDays);
  for (let i = start; i <= start + 45 && out.length < 15; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const value = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    const fa = (o: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        timeZone: "Asia/Tehran",
        ...o,
      }).format(d);
    const weekday = fa({ weekday: "long" });
    if (weekday === "جمعه") continue;
    out.push({
      value,
      weekday,
      day: fa({ day: "numeric" }),
      month: fa({ month: "long" }),
    });
  }
  return out;
}

export default function AcceptOfferForm({
  offerId,
  garageName,
  availableAfterDays,
}: {
  offerId: number;
  garageName: string;
  availableAfterDays: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<SimpleState, FormData>(acceptOfferAction, {});
  const days = useMemo(() => nextDays(availableAfterDays), [availableAfterDays]);
  const [date, setDate] = useState("");

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full">
        انتخاب این پیشنهاد و رزرو نوبت
      </button>
    );

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="date" value={date} />
      <div className="text-sm font-bold">انتخاب تاریخ مراجعه در «{garageName}»</div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button
            type="button"
            key={d.value}
            onClick={() => setDate(d.value)}
            className={`min-w-[72px] shrink-0 rounded-xl border px-2 py-2 text-center text-xs transition ${
              date === d.value
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-slate-200 bg-white hover:border-brand-300"
            }`}
          >
            <div>{d.weekday}</div>
            <div className="text-lg font-extrabold">{d.day}</div>
            <div>{d.month}</div>
          </button>
        ))}
      </div>
      {!date && <p className="text-xs text-slate-500">برای ادامه، یک تاریخ انتخاب کن.</p>}
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton className="btn-primary flex-1">تأیید و رزرو</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          انصراف
        </button>
      </div>
    </form>
  );
}
