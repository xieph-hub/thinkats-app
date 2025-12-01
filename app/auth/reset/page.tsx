// app/auth/reset/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type State =
  | { status: "checking" }
  | { status: "ready"; email: string | null }
  | { status: "success" }
  | { status: "error"; message: string };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "checking" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // On mount, Supabase will see the #access_token in the URL and set a session.
  // We then call getUser() to verify the token is valid.
  useEffect(() => {
    async function init() {
      try {
        const { data, error } = await supabaseBrowser.auth.getUser();
        if (error || !data.user) {
          setState({
            status: "error",
            message:
              "This reset link is invalid or has expired. Please request a new one.",
          });
          return;
        }

        setState({
          status: "ready",
          email: data.user.email ?? null,
        });
      } catch (err) {
        setState({
          status: "error",
          message:
            "Something went wrong while verifying the reset link. Please try again.",
        });
      }
    }

    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setState({
        status: "error",
        message: "Password must be at least 8 characters.",
      });
      return;
    }
    if (password !== confirm) {
      setState({
        status: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    try {
      const { error } = await supabaseBrowser.auth.updateUser({
        password,
      });

      if (error) {
        setState({
          status: "error",
          message: error.message || "Failed to update password.",
        });
        return;
      }

      setState({ status: "success" });

      // Optional: take them to login after a short delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      setState({
        status: "error",
        message: "Unexpected error updating password. Please try again.",
      });
    }
  }

  const errorMessage =
    state.status === "error" ? state.message : undefined;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Reset your password
      </h1>

      {state.status === "checking" && (
        <p className="mt-4 text-sm text-slate-600">
          Verifying reset link…
        </p>
      )}

      {state.status === "ready" && (
        <>
          <p className="mt-2 text-sm text-slate-600">
            {state.email
              ? `Set a new password for ${state.email}.`
              : "Set a new password for your account."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Update password
            </button>

            {errorMessage && (
              <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            )}
          </form>
        </>
      )}

      {state.status === "success" && (
        <p className="mt-4 text-sm text-emerald-700">
          Password updated successfully. Redirecting to login…
        </p>
      )}

      {state.status === "error" && (
        <>
          <p className="mt-4 text-sm text-red-600">
            {errorMessage ??
              "Something went wrong. Please request a new reset link."}
          </p>
        </>
      )}
    </div>
  );
}
