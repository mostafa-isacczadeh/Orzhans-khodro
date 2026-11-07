"use client";

import { useActionState, useState } from "react";
import { submitOfferAction } from "@/app/actions/business";
import type { SimpleState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "./common";

type Existing = {
  price: number;
  availableAfterDays: number;
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
        <input
          name="price"
          dir="ltr"
          inputMode="numeric"
          className="input text-left text-lg font-bold"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="2500000"
          required
        />
        {pretty && <p className="mt-1 text-xs text-slate-500">{pretty} تومان</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">اولین روز آزاد پذیرش (چند روز دیگر) *</label>
          <input
            name="availableAfterDays"
            type="number"
            min="0"
            max="365"
            inputMode="numeric"
            dir="ltr"
            className="input"
            defaultValue={existing?.availableAfterDays ?? 0}
            required
          />
        </div>
        <div>
          <label className="label">مدت انجام تعمیر (روز) *</label>
          <input
            name="estimatedDays"
            type="number"
            min="1"
            max="365"
            inputMode="numeric"
            dir="ltr"
            className="input"
            defaultValue={existing?.estimatedDays ?? 1}
            required
          />
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full">{existing ? "به‌روزرسانی پیشنهاد" : "ارسال پیشنهاد قیمت"}</SubmitButton>
      <p className="text-center text-[11px] text-slate-400">
        🔒 قیمت شما فقط برای مشتری و مدیریت قابل مشاهده است و سایر تعمیرگاه‌ها آن را نمی‌بینند.
      </p>
    </form>
  );
}
