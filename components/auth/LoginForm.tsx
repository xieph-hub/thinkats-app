// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type LoginFormProps = {
  callbackUrl?: string | null;
};

type Status = "idle" | "loading" | "success" | "error";

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();

  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  // Fallback if callbackUrl is missing or weird
  const redirectTarget =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/ats";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Login error:", error);
        setStatus("error");
        setMessage(
          error.message ||
            "Unable to log in. Please check your email and password."
        );
        return;
      }

      // ✅ Login successful
      setStatus("success");
      setMessage("Logged in successfully. Redirecting...");

      // Small delay so the user sees the success message
      setTimeout(() => {
        router.push(redirectTarget);
        // Ensure server components see the fresh auth cookies/session
        router.refresh();
      }, 400);
    } catch (err) {
      console.error("Unexpected login error:", err);
      setStatus("error");
      setMessage("Something went wrong while logging you in. Please try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
      <h2 className="text-lg font-semibold tracking-tight text-slate-50">
        Log in
      </h2>
      <p className="mt-1 text-xs text-slate-400">
        Use your work email and password to continue.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Workspace / organisation (optional) */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            ORGANISATION / WORKSPACE (OPTIONAL)
          </label>
          <input
            type="text"
            autoComplete="organization"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
            placeholder="resourcin, acme, client-name..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <p className="text-[11px] text-slate-500">
            Helps us route you to the right tenant/workspace (coming soon).
          </p>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            WORK EMAIL
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-medium text-slate-300">
              PASSWORD
            </label>
            <a
              href="/auth/forgot"
              className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
            >
              Forgot password?
            </a>
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Status / messages */}
        {message && (
          <p
            className={`text-[11px] ${
              status === "error"
                ? "text-rose-400"
                : status === "success"
                ? "text-emerald-400"
                : "text-slate-400"
            }`}
          >
            {message}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading
            ? "Logging in..."
            : isSuccess
            ? "Logged in. Redirecting..."
            : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-[11px] text-slate-500">
        Don&apos;t have access yet?{" "}
        <a
          href="/request-workspace"
          className="font-medium text-sky-400 hover:text-sky-300"
        >
          Request a workspace
        </a>
      </p>
    </div>
  );
}
