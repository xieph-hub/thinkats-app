// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type LoginFormProps = {
  redirectTo?: string;
  initialWorkspace?: string;
};

export default function LoginForm({
  redirectTo = "/ats",
  initialWorkspace = "",
}: LoginFormProps) {
  const router = useRouter();

  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Supabase log in error:", error);
        setErrorMessage(error.message || "Unable to log in. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (workspace.trim()) {
        try {
          window.localStorage.setItem(
            "thinkats:workspaceHint",
            workspace.trim()
          );
        } catch {
          // ignore storage failures
        }
      }

      setStatusMessage("Logged in successfully. Redirecting…");

      const target = redirectTo || "/ats";

      if (typeof window !== "undefined") {
        // Hard navigation so the whole app re-hydrates with the new session
        window.location.assign(target);
      } else {
        router.replace(target);
      }
    } catch (err) {
      console.error("Unexpected log in error:", err);
      setErrorMessage("Something went wrong while logging you in.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-slate-800/80 px-6 py-8 shadow-2xl shadow-sky-900/30 backdrop-blur">
      <h1 className="text-2xl font-semibold text-white mb-1">Log in</h1>
      <p className="text-sm text-slate-300 mb-6">
        Use your work email and password to continue.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Organisation / Workspace (optional) */}
        <div>
          <label
            htmlFor="workspace"
            className="block text-xs font-semibold tracking-wide text-slate-300 mb-1.5 uppercase"
          >
            Organisation / workspace (optional)
          </label>
          <input
            id="workspace"
            type="text"
            autoComplete="organization"
            placeholder="resourcin, acme, client-name..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Helps us route you to the right tenant/workspace.
          </p>
        </div>

        {/* Work email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold tracking-wide text-slate-300 mb-1.5 uppercase"
          >
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold tracking-wide text-slate-300 uppercase"
            >
              Password
            </label>
            <a
              href="/auth/forgot"
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Messages */}
        {errorMessage && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
            {errorMessage}
          </p>
        )}

        {statusMessage && !errorMessage && (
          <p className="text-xs text-emerald-300">{statusMessage}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-slate-950 transition"
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>

        <p className="mt-3 text-[11px] text-slate-400 text-center">
          Don’t have access yet?{" "}
          <a
            href="/request-workspace"
            className="text-sky-400 hover:text-sky-300"
          >
            Request a workspace
          </a>
        </p>
      </form>
    </div>
  );
}
