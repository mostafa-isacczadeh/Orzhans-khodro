"use client";

import { useActionState, useState } from "react";
import { submitOfferAction } from "@/app/actions/business";
import type { SimpleState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "./common";

type Existing = {
  price: number;
  availableAfterDays: number;
  availableDates?: string[];
  estimatedDays: number;
} | null;

export default function OfferForm({ requestId, existing }: { requestId: number; existing: Existing }) {
  const [state, action] = useActionState<SimpleState, FormData>(submitOfferAction, {});
  const [price, setPrice] = useState(existing ? String(existing.price) : "");
  const pretty = price ? new Intl.NumberFormat("fa-IR").format(Number(price)) : "";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <div>
        <label className="label">قیمت پیشنهادی (تومان) *</label>
        <input name="price" dir="ltr" inputMode="numeric" className="input text-left text-lg font-bold"
          value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="2500000" required />
        {pretty && <p className="mt-1 text-xs text-slate-500">{pretty} تومان</p>}
      </div>
      <div>
        <label className="label">روزهای آزاد پذیرش برای مراجعه *</label>
        <p className="mb-2 text-xs text-slate-500">تاریخ‌های مشخصی را که امکان پذیرش خودرو دارید انتخاب کنید. حداکثر ۱۰ تاریخ؛ جمعه قابل انتخاب نیست.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 10 }, (_, i) => (
            <input key={i} type="date" name="availableDates" className="input" required={i === 0}
              defaultValue={existing?.availableDates?.[i] ?? ""} aria-label={`تاریخ آزاد ${i + 1}`} />
          ))}
        </div>
      </div>
      <div>
        <label className="label">مدت انجام تعمیر (روز) *</label>
        <input name="estimatedDays" type="number" min="1" max="365" inputMode="numeric" dir="ltr"
          className="input" defaultValue={existing?.estimatedDays ?? 1} required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full">{existing ? "به‌روزرسانی پیشنهاد" : "ارسال پیشنهاد قیمت"}</SubmitButton>
      <p className="text-center text-[11px] text-slate-400">🔒 پیشنهاد شما فقط برای مشتری و مدیریت قابل مشاهده است.</p>
    </form>
  );
}
