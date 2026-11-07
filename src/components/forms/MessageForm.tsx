"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessageAction } from "@/app/actions/messages";
import type { SimpleState } from "@/app/actions/auth";
import { SubmitButton } from "./common";

export default function MessageForm({
  requestId,
  participantId,
  path,
}: {
  requestId: number;
  participantId?: number;
  path: string;
}) {
  const [state, action] = useActionState<SimpleState, FormData>(sendMessageAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="path" value={path} />
      {participantId && <input type="hidden" name="participantId" value={participantId} />}
      <input name="body" className="input flex-1" placeholder="پیام خود را بنویسید..." autoComplete="off" />
      <SubmitButton className="btn-dark" pendingText="...">
        ارسال
      </SubmitButton>
      {state.error && <span className="self-center text-xs text-rose-600">{state.error}</span>}
    </form>
  );
}
