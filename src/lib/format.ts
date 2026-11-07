export function toFaDigits(v: string | number) {
  return String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function formatToman(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n);
}

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tehran",
  }).format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tehran",
  }).format(new Date(d));
}

export function timeAgo(d: Date | string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "لحظاتی پیش";
  if (diff < 3600) return `${toFaDigits(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${toFaDigits(Math.floor(diff / 3600))} ساعت پیش`;
  if (diff < 86400 * 30) return `${toFaDigits(Math.floor(diff / 86400))} روز پیش`;
  return formatDate(d);
}

export function maskPhone(p: string) {
  if (p.length < 11) return p;
  return toFaDigits(p.slice(0, 4) + "***" + p.slice(-4));
}
