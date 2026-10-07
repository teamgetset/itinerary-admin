"use client";

import { buttonStyles } from "@/components/ui";

/** Shown when a page's data cannot be loaded (API down, or the user's role does not allow it). */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const forbidden = /permission|role/i.test(error.message);
  return (
    <div className="mx-auto max-w-lg rounded-card border border-line bg-white p-8 text-center">
      <h1 className="text-xl font-bold text-navy">{forbidden ? "Not available for your role" : "This page could not load"}</h1>
      <p className="mt-2 text-sm text-muted">
        {forbidden ? "Ask a super admin if you need access." : "The GETSET API may be restarting or unreachable. Try again in a moment."}
      </p>
      {!forbidden && (
        <button type="button" onClick={reset} className={`${buttonStyles.primary} mt-5`}>
          Try again
        </button>
      )}
    </div>
  );
}
