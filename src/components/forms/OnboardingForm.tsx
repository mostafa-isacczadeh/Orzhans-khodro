"use client";

import { useActionState, useState } from "react";
import { onboardingAction, type SimpleState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "./common";

export default function OnboardingForm({ isAdmin, defaultName }: { isAdmin: boolean; defaultName: string }) {
  const [state, action] = useActionState<SimpleState, FormData>(onboardingAction, {});
  const [role, setRole] = useState("customer");
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="label">نام و نام خانوادگی</label>
        <input name="name" defaultValue={defaultName} className="input" placeholder="مثلاً علی رضایی" required />
      </div>
      {!isAdmin && (
        <div>
          <label className="label">نوع حساب</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: "customer", t: "صاحب خودرو", d: "می‌خواهم قیمت بگیرم و نوبت رزرو کنم", i: "🚙" },
              { v: "business", t: "صاحب تعمیرگاه", d: "می‌خواهم به مشتریان پیشنهاد قیمت بدهم", i: "🏭" },
            ].map((o) => (
              <label
                key={o.v}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                  role === o.v ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={o.v}
                  checked={role === o.v}
                  onChange={() => setRole(o.v)}
                  className="sr-only"
                />
                <div className="text-2xl">{o.i}</div>
                <div className="mt-1 font-bold">{o.t}</div>
                <div className="mt-1 text-xs text-slate-500">{o.d}</div>
              </label>
            ))}
          </div>
        </div>
      )}
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full !py-3">ادامه</SubmitButton>
    </form>
  );
}
