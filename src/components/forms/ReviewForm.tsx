"use client";

import { useActionState, useState } from "react";
import { reviewAction } from "@/app/actions/customer";
import type { SimpleState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "./common";

export default function ReviewForm({ bookingId }: { bookingId: number }) {
  const [state, action] = useActionState<SimpleState, FormData>(reviewAction, {});
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  if (state.ok) return <FormMessage state={state} />;
  const labels = ["", "ضعیف", "متوسط", "خوب", "خیلی خوب", "عالی"];
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-3">
        <div className="flex" dir="ltr" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className={`text-3xl transition ${(hover || rating) >= n ? "text-amber-400" : "text-slate-300"}`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-600">{labels[hover || rating]}</span>
      </div>
      <textarea name="comment" rows={3} className="input" placeholder="تجربه خود از کیفیت کار، برخورد و تحویل به‌موقع را بنویسید" />
      <FormMessage state={state} />
      <SubmitButton>ثبت امتیاز</SubmitButton>
    </form>
  );
}
