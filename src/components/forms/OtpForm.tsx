"use client";

import { useActionState } from "react";
import { otpAction, type OtpState } from "@/app/actions/auth";
import { SubmitButton } from "./common";

export default function OtpForm() {
  const [state, action] = useActionState<OtpState, FormData>(otpAction, { step: "phone" });

  return (
    <form action={action} className="space-y-4">
      {state.step === "phone" ? (
        <>
          <div>
            <label className="label" htmlFor="phone">
              شماره موبایل
            </label>
            <input
              id="phone"
              name="phone"
              inputMode="tel"
              dir="ltr"
              autoFocus
              defaultValue={state.phone}
              placeholder="09xxxxxxxxx"
              className="input text-center text-lg tracking-widest"
              required
            />
          </div>
          {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
          <SubmitButton name="intent" value="send" className="btn-primary w-full !py-3">
            دریافت کد تأیید
          </SubmitButton>
        </>
      ) : (
        <>
          <input type="hidden" name="phone" value={state.phone} />
          <p className="text-sm text-slate-600">
            کد ۵ رقمی ارسال شده به <b dir="ltr">{state.phone}</b> را وارد کنید.
          </p>
          <input
            name="code"
            inputMode="numeric"
            dir="ltr"
            autoFocus
            maxLength={5}
            placeholder="- - - - -"
            className="input text-center text-2xl tracking-[0.5em]"
            autoComplete="one-time-code"
          />
          {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
          <SubmitButton name="intent" value="verify" className="btn-primary w-full !py-3">
            تأیید و ورود
          </SubmitButton>
          <div className="flex justify-between text-sm">
            <button name="intent" value="edit" className="text-slate-500 hover:text-slate-800">
              ویرایش شماره
            </button>
            <button name="intent" value="resend" className="text-brand-600 hover:text-brand-700">
              ارسال مجدد کد
            </button>
          </div>
        </>
      )}
    </form>
  );
}
