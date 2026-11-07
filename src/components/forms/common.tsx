"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText = "در حال ارسال...",
  name,
  value,
  confirm,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { error?: string; ok?: string } }) {
  if (state.error)
    return <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>;
  if (state.ok)
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>
    );
  return null;
}
