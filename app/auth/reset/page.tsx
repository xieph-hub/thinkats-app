"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Stage = "initializing" | "password" | "done" | "error";

export default function AuthResetPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function initFromUrl() {
      try {
        // Supabase sends tokens in the URL hash:
        //   /auth/reset#access_token=...&refresh_token=...&type=recovery
        let params: URLSearchParams | null = null;

        if (typeof window === "undefined") return;

        const { hash, search } = window.location;

        if (hash && hash.startsWith("#")) {
          params = new URLSearchParams(hash.slice(1));
        } else if (search && search.startsWith("?")) {
          // Fallback if for some reason it comes as query params instead
          params = new URLSearchParams(search.slice(1));
        }

        if (!params) {
          setError("Missing reset parameters in URL. Please request a new reset link.");
          setStage("error");
          return;
        }

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");

        if (!access_token || !refresh_token) {
          setError("Missing auth tokens in URL. Please request a new reset link.");
          setStage("error");
          return;
        }

        // Explicitly set the session using the tokens from the URL
        const { error: sessionError } = await supabaseBrowser.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error("[auth/reset] setSession error:", sessionError);
          setError(sessionError.message || "Unable to establish a secure session.");
          setStage("error");
          return;
        }

        // If Supabase says this is a password recovery flow, show the password form
        if (type === "recovery") {
          setStage("password");
          return;
        }

        // Any other type (magic link, normal sign-in) → just route into ATS
        setStage("done");
        router.replace("/ats");
      } catch (err: any) {
        console.error("[auth/reset] unexpected error:", err);
        setError("Something went wrong while processing your login link.");
        setStage("error");
      }
    }

    void initFromUrl();
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const { error: updateError } = await supabaseBrowser.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("[auth/reset] updateUser error:", updateError);
        setError(updateError.message || "Unable to update your password.");
        setIsSubmitting(false);
        return;
      }

      setStage("done");
      // After successful reset, drop user into the ATS workspace
      router.replace("/ats");
    } catch (err: any) {
      console.error("[auth/reset] unexpected error on submit:", err);
      setError("Unexpected error while updating your password.");
      setIsSubmitting(false);
    }
  }

  // --- UI states ---

  if (stage === "initializing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Processing your secure ThinkATS link...
        </p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-700 mb-2">
            We couldn&apos;t complete your request
          </h1>
          <p className="text-sm text-red-700 mb-4">
            {error ||
              "Something went wrong while processing your password reset link. Please request a new one from the login page."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex items-center justify-center rounded-full border border-red-600 px-4 py-2 text-sm font-medium text-red-700"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (stage === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">
            Set a new ThinkATS password
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            You&apos;ve been securely verified. Choose a new password to continue.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                New password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/80 focus:border-black/80"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum 8 characters, ideally with a mix of letters, numbers and symbols.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/80 focus:border-black/80"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-black text-white text-sm font-medium py-2.5 disabled:opacity-60"
            >
              {isSubmitting ? "Updating password..." : "Update password & continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // stage === "done"
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">
        Password updated. Redirecting you to your ATS workspace...
      </p>
    </div>
  );
}
