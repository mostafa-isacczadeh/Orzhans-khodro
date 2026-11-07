import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { garages, users } from "@/db/schema";
import { requireMainAdmin } from "@/lib/auth";
import { getGarageStats } from "@/lib/queries";
import { GARAGE_STATUS } from "@/lib/constants";
import { formatDate, toFaDigits } from "@/lib/format";
import { Badge, PageTitle, ServiceChips, Stars } from "@/components/ui";
import { SubmitButton } from "@/components/forms/common";
import { setGarageStatusAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminGarages({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireMainAdmin();
  const { status } = await searchParams;
  const rows = await db
    .select({ g: garages, ownerName: users.name, ownerPhone: users.phone, ownerRole: users.role })
    .from(garages)
    .innerJoin(users, eq(users.id, garages.ownerId))
    .where(status ? eq(garages.status, status) : undefined)
    .orderBy(desc(garages.createdAt));
  const stats = await getGarageStats(rows.map((r) => r.g.id));

  return (
    <div>
      <PageTitle title="تعمیرگاه‌ها" subtitle="بررسی، تأیید و تعلیق تعمیرگاه‌ها" />
      <div className="mb-4 flex flex-wrap gap-2">
        {[["", "همه"], ...Object.entries(GARAGE_STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <Link
            key={k}
            href={k ? `/admin/garages?status=${k}` : "/admin/garages"}
            className={`rounded-full px-4 py-1.5 text-sm ${(status ?? "") === k ? "bg-ink-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {l}
          </Link>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ g, ownerName, ownerPhone, ownerRole }) => {
          const s = stats.get(g.id)!;
          return (
            <div key={g.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/garages/${g.id}`} className="font-bold hover:text-brand-600">
                    {g.name} {ownerRole === "admin" && <span className="badge bg-ink-900 text-white">گاراژ مدیر</span>}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {ownerName} · <span dir="ltr">{ownerPhone}</span>
                  </div>
                </div>
                <Badge map={GARAGE_STATUS} value={g.status} />
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <div>📍 {g.city}{g.district && ` · ${g.district}`} — {g.address}</div>
                {g.phone && <div dir="ltr" className="text-right">☎ {g.phone}</div>}
                <div>
                  <Stars value={s.avg} count={s.count} /> · ✔️ {toFaDigits(s.completed)} کار
                </div>
                <div className="text-xs text-slate-400">ثبت: {formatDate(g.createdAt)}</div>
              </div>
              <div className="mt-2">
                <ServiceChips services={g.services} />
              </div>
              <form action={setGarageStatusAction} className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                <input type="hidden" name="garageId" value={g.id} />
                {g.status !== "approved" && (
                  <SubmitButton name="status" value="approved" className="btn-primary">
                    تأیید
                  </SubmitButton>
                )}
                {g.status !== "suspended" && (
                  <SubmitButton name="status" value="suspended" className="btn-danger" confirm="این تعمیرگاه تعلیق شود؟">
                    تعلیق
                  </SubmitButton>
                )}
              </form>
            </div>
          );
        })}
      </div>
      {rows.length === 0 && <p className="card p-8 text-center text-sm text-slate-400">موردی وجود ندارد.</p>}
    </div>
  );
}
