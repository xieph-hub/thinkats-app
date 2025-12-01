// app/login/page.tsx
import { Suspense } from "react";
import LoginFormClient from "./LoginFormClient";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="flex w-full items-center justify-center text-sm text-slate-500">
            Loading…
          </div>
        }
      >
        <LoginFormClient />
      </Suspense>
    </div>
  );
}
