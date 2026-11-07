"use client";

import { useActionState } from "react";
import { passwordLoginAction, type SimpleState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "./common";

export default function PasswordLoginForm() {
  const [state, action] = useActionState<SimpleState, FormData>(
    passwordLoginAction,
    {}
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="phone">شماره موبایل</label>
        <input
          id="phone"
          name="phone"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          placeholder="09xxxxxxxxx"
          className="input text-center text-lg tracking-widest"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">رمز عبور</label>
        <input
          id="password"
          name="password"
          type="password"
          inputMode="numeric"
          dir="ltr"
          autoComplete="current-password"
          maxLength={128}
          placeholder="رمز عبور"
          className="input"
        />
        <p className="mt-1 text-xs text-slate-500">
          مشتری و تعمیرگاه: ۳ تا ۵ رقم؛ مدیر کل: حداقل ۵ رقم.
          در دستگاه مورداعتماد، رمز لازم نیست.
        </p>
      </div>
      <p className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-800">
        روشن بودن فیلترشکن ممکن است در اتصال اختلال ایجاد کند.
        در صورت بروز مشکل، آن را خاموش کنید و دوباره تلاش کنید.
      </p>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full !py-3">
        ورود یا ساخت حساب
      </SubmitButton>
    </form>
  );
}
