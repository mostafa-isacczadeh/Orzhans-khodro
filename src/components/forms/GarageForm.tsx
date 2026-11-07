"use client";

import { useActionState } from "react";
import { saveGarageAction } from "@/app/actions/business";
import type { SimpleState } from "@/app/actions/auth";
import { CITIES, SERVICES } from "@/lib/constants";
import { FormMessage, SubmitButton } from "./common";

type G = {
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  description: string;
  workingHours: string;
  experienceYears: number;
  services: string[];
} | null;

export default function GarageForm({ garage }: { garage: G }) {
  const [state, action] = useActionState<SimpleState, FormData>(saveGarageAction, {});
  return (
    <form action={action} className="space-y-6">
      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">اطلاعات عمومی (قابل مشاهده برای مشتریان)</h2>
        <div>
          <label className="label">نام تعمیرگاه *</label>
          <input name="name" defaultValue={garage?.name} className="input" required placeholder="مثلاً صافکاری و نقاشی آریا" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">شهر *</label>
            <select name="city" defaultValue={garage?.city ?? ""} className="input" required>
              <option value="" disabled>
                انتخاب
              </option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">محدوده کلی</label>
            <input name="district" defaultValue={garage?.district} className="input" placeholder="مثلاً غرب تهران" />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="label">خدمات قابل ارائه *</label>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <label
                key={s.key}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
              >
                <input
                  type="checkbox"
                  name="services"
                  value={s.key}
                  defaultChecked={garage?.services.includes(s.key)}
                  className="accent-brand-500"
                />
                {s.icon} {s.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="label">سابقه کار (سال)</label>
          <input name="experienceYears" defaultValue={garage?.experienceYears || ""} inputMode="numeric" className="input" />
        </div>
        <div>
          <label className="label">ساعات کاری</label>
          <input
            name="workingHours"
            defaultValue={garage?.workingHours}
            className="input"
            placeholder="شنبه تا پنجشنبه ۸ تا ۱۸"
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">معرفی و تخصص‌ها</label>
          <textarea
            name="description"
            defaultValue={garage?.description}
            rows={4}
            className="input"
            placeholder="درباره تجهیزات، تخصص‌ها، برندهای رنگ مورد استفاده و ضمانت‌ها بنویسید"
          />
        </div>
      </section>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="font-bold">اطلاعات محرمانه 🔒</h2>
          <p className="mt-1 text-xs text-slate-500">
            این اطلاعات فقط برای مدیریت اورژانس خودرو قابل مشاهده است و به مشتریان نمایش داده نمی‌شود. هماهنگی‌ها از طریق
            پشتیبانی انجام می‌شود.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="label">آدرس دقیق *</label>
          <input name="address" defaultValue={garage?.address} className="input" required />
        </div>
        <div>
          <label className="label">تلفن تعمیرگاه</label>
          <input name="phone" defaultValue={garage?.phone} dir="ltr" className="input" />
        </div>
      </section>

      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full !py-3">{garage ? "ذخیره تغییرات" : "ثبت تعمیرگاه"}</SubmitButton>
    </form>
  );
}
