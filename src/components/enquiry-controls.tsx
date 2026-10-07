"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addEnquiryNote, updateEnquiryStatus } from "@/app/(admin)/actions";
import { humanize } from "@/lib/format";
import { ENQUIRY_STATUSES } from "@/lib/enquiries";
import { FormMessage } from "./resource-form";
import { buttonStyles, inputStyles } from "./ui";

export function EnquiryStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  return (
    <div className="space-y-2">
      <label htmlFor="enquiry-status" className="block text-sm font-semibold">
        Status
      </label>
      <select
        id="enquiry-status"
        defaultValue={status}
        disabled={pending}
        className={inputStyles}
        onChange={(event) =>
          start(async () => {
            const saved = await updateEnquiryStatus(id, event.target.value);
            setResult(saved);
            if (saved.ok) router.refresh();
          })
        }
      >
        {ENQUIRY_STATUSES.map((value) => (
          <option key={value} value={value}>
            {humanize(value)}
          </option>
        ))}
      </select>
      <FormMessage result={result} />
    </div>
  );
}

/** Internal notes: visible to staff only, never to the customer. */
export function EnquiryNoteForm({ id }: { id: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const saved = await addEnquiryNote(id, body);
          setResult(saved);
          if (saved.ok) {
            setBody("");
            router.refresh();
          }
        });
      }}
    >
      <label htmlFor="note" className="block text-sm font-semibold">
        Add an internal note
      </label>
      <textarea id="note" rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Called, sent quote, waiting for passport copies…" className={inputStyles} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || !body.trim()} className={buttonStyles.primary}>
          {pending ? "Adding…" : "Add note"}
        </button>
        <FormMessage result={result} />
      </div>
    </form>
  );
}
