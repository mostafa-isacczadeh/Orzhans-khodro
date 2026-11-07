import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { formatDate, formatDateTime, timeAgo, toFaDigits } from "@/lib/format";
import { REQUEST_STATUS } from "@/lib/constants";
import { ADMIN_PHONE, getCurrentUser } from "@/lib/auth";
import { canViewRequest } from "@/lib/queries";
import { Badge, ServiceChips } from "./ui";
import MessageForm from "./forms/MessageForm";

type Media = { id: number; kind: string; mime: string };

export function MediaGallery({ media }: { media: Media[] }) {
  if (media.length === 0) return <p className="text-sm text-slate-500">فایلی بارگذاری نشده است.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {media.map((m) =>
        m.kind === "video" ? (
          <video
            key={m.id}
            controls
            preload="metadata"
            playsInline
            className="aspect-square w-full rounded-xl bg-black object-cover"
          >
            <source src={`/api/media/${m.id}`} type={m.mime === "video/quicktime" ? "video/mp4" : m.mime} />
          </video>
        ) : (
          <a key={m.id} href={`/api/media/${m.id}`} target="_blank" className="block overflow-hidden rounded-xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/media/${m.id}`}
              alt="عکس خودرو"
              loading="lazy"
              className="aspect-square w-full object-cover transition hover:scale-105"
            />
          </a>
        )
      )}
    </div>
  );
}

export async function MessageThread({
  requestId,
  participantId,
  viewerId,
  path,
  title = "گفتگو با پشتیبانی اورژانس خودرو",
  hint,
  asAdmin = false,
}: {
  requestId: number;
  participantId: number;
  viewerId: number;
  path: string;
  title?: string;
  hint?: string;
  asAdmin?: boolean;
}) {
  const viewer = await getCurrentUser();
  if (!viewer) notFound();

  const isMainAdmin =
    viewer.role === "admin" && viewer.phone === ADMIN_PHONE;

  if (!isMainAdmin) {
    if (participantId !== viewer.id) notFound();
    if (!(await canViewRequest(viewer, requestId))) notFound();
  }

  // مجوز مدیریتی فقط از هویت مدیر اصلی تعیین می‌شود.
  asAdmin = isMainAdmin;

  const list = await db
    .select({ id: messages.id, body: messages.body, senderId: messages.senderId, createdAt: messages.createdAt, senderName: users.name, senderRole: users.role })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(and(eq(messages.requestId, requestId), eq(messages.participantId, participantId)))
    .orderBy(asc(messages.createdAt));

  return (
    <div className="card p-5">
      <h3 className="font-bold">💬 {title}</h3>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <div className="my-4 max-h-80 space-y-2 overflow-y-auto">
        {list.length === 0 && <p className="py-4 text-center text-sm text-slate-400">هنوز پیامی ارسال نشده است.</p>}
        {list.map((m) => {
          const mine = m.senderId === viewerId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "rounded-tr-sm bg-ink-900 text-white" : "rounded-tl-sm bg-slate-100 text-slate-800"
                }`}
              >
                <div className={`mb-0.5 text-[11px] ${mine ? "text-slate-400" : "text-slate-500"}`}>
                  {m.senderRole === "admin" && !asAdmin ? "پشتیبانی اورژانس خودرو" : m.senderName} · {timeAgo(m.createdAt)}
                </div>
                <div className="whitespace-pre-wrap">{m.body}</div>
              </div>
            </div>
          );
        })}
      </div>
      <MessageForm requestId={requestId} participantId={asAdmin ? participantId : undefined} path={path} />
    </div>
  );
}

export function RequestCard({
  href,
  r,
  extra,
}: {
  href: string;
  r: { id: number; carModel: string; carYear: string; city: string; services: string[]; status: string; createdAt: Date; description: string };
  extra?: React.ReactNode;
}) {
  return (
    <Link href={href} className="card block p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold">
            {r.carModel} {r.carYear && <span className="font-normal text-slate-500">({r.carYear})</span>}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            📍 {r.city} · کد {toFaDigits(r.id)} · {timeAgo(r.createdAt)}
          </div>
        </div>
        <Badge map={REQUEST_STATUS} value={r.status} />
      </div>
      <div className="mt-3">
        <ServiceChips services={r.services} />
      </div>
      {r.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{r.description}</p>}
      {extra && <div className="mt-3 border-t border-slate-100 pt-3">{extra}</div>}
    </Link>
  );
}

export function BookingBox({ scheduledAt }: { scheduledAt: Date }) {
  return (
    <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
      📅 تاریخ مراجعه: <b>{formatDate(scheduledAt)}</b>
    </div>
  );
}
