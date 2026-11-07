import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ADMIN_PHONE, requireMainAdmin } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/constants";
import { formatDate, toFaDigits } from "@/lib/format";
import { PageTitle } from "@/components/ui";
import { SubmitButton } from "@/components/forms/common";
import { setUserRoleAction, toggleBlockAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireMainAdmin();
  const { q } = await searchParams;
  const rows = await db
    .select()
    .from(users)
    .where(q ? or(ilike(users.name, `%${q}%`), ilike(users.phone, `%${q}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(300);

  return (
    <div>
      <PageTitle title="کاربران" subtitle={`${toFaDigits(rows.length)} کاربر`} />
      <form className="card mb-4 flex gap-3 p-4">
        <input name="q" defaultValue={q} className="input" placeholder="جستجوی نام یا شماره" />
        <button className="btn-dark">جستجو</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr className="text-right">
              <th className="p-3">نام</th>
              <th className="p-3">موبایل</th>
              <th className="p-3">نقش</th>
              <th className="p-3">عضویت</th>
              <th className="p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const locked = u.phone === ADMIN_PHONE;
              return (
                <tr key={u.id} className={`border-t border-slate-100 ${u.isBlocked ? "bg-rose-50/60" : ""}`}>
                  <td className="p-3 font-semibold">
                    {u.name || "—"} {u.isBlocked && <span className="badge bg-rose-100 text-rose-700">مسدود</span>}
                  </td>
                  <td className="p-3" dir="ltr">
                    {u.phone}
                  </td>
                  <td className="p-3">
                    {locked ? (
                      <span className="badge bg-ink-900 text-white">{ROLE_LABEL[u.role]}</span>
                    ) : (
                      <form action={setUserRoleAction} className="flex gap-1">
                        <input type="hidden" name="userId" value={u.id} />
                        <select name="role" defaultValue={u.role} className="input !w-auto !py-1.5">
                          {Object.entries(ROLE_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                        <SubmitButton className="btn-ghost !px-2 !py-1.5" pendingText="...">
                          ✓
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                  <td className="p-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="p-3">
                    {!locked && (
                      <form action={toggleBlockAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <SubmitButton className={u.isBlocked ? "btn-ghost !py-1.5" : "btn-danger !py-1.5"} pendingText="...">
                          {u.isBlocked ? "رفع مسدودی" : "مسدود کردن"}
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
