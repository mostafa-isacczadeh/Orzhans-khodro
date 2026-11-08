"use client";

import { useActionState } from "react";
import { adminSetupAction, type SimpleState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "./common";

export default function AdminSetupForm() {
  const [state, action] = useActionState<SimpleState, FormData>(adminSetupAction, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">رمز عبور مدیر کل</label>
        <input id="password" name="password" type="password" autoComplete="new-password" inputMode="numeric" pattern="[0-9]{5,128}" dir="ltr" minLength={5} maxLength={128} className="input" required />
        <p className="mt-1 text-xs text-slate-500">حداقل ۵ رقم انگلیسی.</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full !py-3" pendingText="در حال راه‌اندازی...">
        ساخت حساب مدیر کل
      </SubmitButton>
    </form>
  );
}
