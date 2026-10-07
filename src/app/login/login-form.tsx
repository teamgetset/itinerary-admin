"use client";

import { useActionState } from "react";
import { buttonStyles, inputStyles } from "@/components/ui";
import { login, type LoginState } from "./actions";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const message = state.error ?? notice;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? "/"} />
      {message && (
        <p role="alert" className={`rounded-lg px-3 py-2 text-sm ${state.error ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
          {message}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} className={inputStyles} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputStyles} />
      </div>
      <button type="submit" disabled={pending} className={`${buttonStyles.primary} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
