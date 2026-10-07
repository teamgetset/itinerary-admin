import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, expired } = await searchParams;
  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-line bg-white p-8 shadow-sm">
        <p className="text-xs font-bold tracking-[0.2em] text-cobalt uppercase">GETSET</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Admin sign in</h1>
        <p className="mt-1 mb-6 text-sm text-muted">Manage packages, itineraries, prices and enquiries.</p>
        <LoginForm
          next={typeof next === "string" ? next : undefined}
          notice={expired ? "Your session ended. Please sign in again." : undefined}
        />
      </div>
    </main>
  );
}
