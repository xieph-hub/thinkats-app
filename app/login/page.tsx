// app/login/page.tsx
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "ThinkATS | Sign in",
  description:
    "Sign in to ThinkATS to manage tenants, jobs, candidates and clients.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(circle_at_top,_#172965_0,_transparent_60%),_radial-gradient(circle_at_bottom,_#64C247_0,_transparent_55%)] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-xl shadow-slate-900/20 backdrop-blur">
        <div className="mb-5 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            ThinkATS
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Sign in to your workspace
          </h1>
          <p className="text-xs text-slate-600">
            Use your email and password. OTP is only required once per device
            and is handled after login on the ATS side.
          </p>
        </div>

        <LoginForm />

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Having trouble? Contact{" "}
          <a
            href="mailto:support@thinkats.com"
            className="font-medium text-[#172965] underline-offset-2 hover:underline"
          >
            support@thinkats.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
