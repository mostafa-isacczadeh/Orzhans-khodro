import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { garages, reviews, users } from "@/db/schema";
import { requireMainAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Empty, PageTitle, Stars } from "@/components/ui";
import { SubmitButton } from "@/components/forms/common";
import { deleteReviewAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  await requireMainAdmin();
  const rows = await db
    .select({ r: reviews, garage: garages.name, customer: users.name })
    .from(reviews)
    .innerJoin(garages, eq(garages.id, reviews.garageId))
    .innerJoin(users, eq(users.id, reviews.customerId))
    .orderBy(desc(reviews.createdAt))
    .limit(200);
  return (
    <div>
      <PageTitle title="نظرات و امتیازها" subtitle="نظارت بر کیفیت و حذف نظرات نامناسب" />
      {rows.length === 0 ? (
        <Empty icon="⭐" title="هنوز نظری ثبت نشده" />
      ) : (
        <div className="space-y-3">
          {rows.map(({ r, garage, customer }) => (
            <div key={r.id} className="card flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <div className="text-sm">
                  <b>{customer}</b> برای{" "}
                  <Link href={`/garages/${r.garageId}`} className="font-bold text-brand-600">
                    {garage}
                  </Link>
                </div>
                <Stars value={r.rating} />
                {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                <div className="text-xs text-slate-400">{formatDate(r.createdAt)}</div>
              </div>
              <form action={deleteReviewAction}>
                <input type="hidden" name="reviewId" value={r.id} />
                <SubmitButton className="btn-danger !py-1.5" confirm="این نظر حذف شود؟">
                  حذف
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
