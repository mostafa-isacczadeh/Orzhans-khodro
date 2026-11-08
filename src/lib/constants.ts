export const SERVICES = [
  { key: "bodywork", label: "صافکاری", icon: "🔨", desc: "رفع فرورفتگی، ضربه و تغییر شکل بدنه بدون آسیب به رنگ" },
  { key: "paint", label: "نقاشی", icon: "🎨", desc: "رنگ‌آمیزی موضعی و کامل با رنگ کوره‌ای و هم‌رنگی دقیق" },
  { key: "detailing", label: "دیتیلینگ", icon: "✨", desc: "پولیش، سرامیک، صفرشویی و احیای داخل و بیرون خودرو" },
  { key: "plastic", label: "جوش پلاستیک", icon: "🔧", desc: "ترمیم سپر، چراغ و قطعات پلاستیکی شکسته یا ترک‌خورده" },
] as const;

export type ServiceKey = (typeof SERVICES)[number]["key"];

export function serviceLabel(key: string) {
  return SERVICES.find((s) => s.key === key)?.label ?? key;
}

export const CITIES = [
  "تهران",
  "کرج",
  "مشهد",
  "اصفهان",
  "شیراز",
  "تبریز",
  "قم",
  "اهواز",
  "رشت",
  "کرمانشاه",
  "یزد",
  "ارومیه",
  "همدان",
  "کرمان",
  "قزوین",
  "ساری",
];

export const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "در انتظار پیشنهاد", cls: "bg-sky-100 text-sky-800" },
  booked: { label: "رزرو شده", cls: "bg-violet-100 text-violet-800" },
  in_progress: { label: "در حال تعمیر", cls: "bg-amber-100 text-amber-800" },
  completed: { label: "تکمیل شده", cls: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "لغو شده", cls: "bg-slate-200 text-slate-700" },
};

export const OFFER_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "در انتظار تصمیم مشتری", cls: "bg-sky-100 text-sky-800" },
  accepted: { label: "پذیرفته شد", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "انتخاب نشد", cls: "bg-slate-200 text-slate-700" },
  withdrawn: { label: "پس گرفته شد", cls: "bg-rose-100 text-rose-800" },
};

export const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "نوبت ثبت شده", cls: "bg-violet-100 text-violet-800" },
  in_progress: { label: "در حال تعمیر", cls: "bg-amber-100 text-amber-800" },
  completed: { label: "تحویل داده شد", cls: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "لغو شده", cls: "bg-slate-200 text-slate-700" },
};

export const GARAGE_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "در انتظار تأیید", cls: "bg-amber-100 text-amber-800" },
  approved: { label: "تأیید شده", cls: "bg-emerald-100 text-emerald-800" },
  suspended: { label: "تعلیق شده", cls: "bg-rose-100 text-rose-800" },
};

export const ROLE_LABEL: Record<string, string> = {
  customer: "مشتری",
  business: "صاحب کسب‌وکار",
  admin: "مدیر فرعی",
};

export const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export const MAX_IMAGE_MB = 5;
export const MAX_VIDEO_MB = 10;
export const MAX_FILES = 5;
export const MIN_IMAGES = 2;
export const MAX_VIDEOS = 1;
export const MAX_TOTAL_UPLOAD_MB = 20;
