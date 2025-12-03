// app/access-denied/page.tsx
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">
          Access restricted
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your email address is not allowed to access the ThinkATS workspace.
          Please sign in with an approved company email address or contact your
          administrator.
        </p>

        <div className="mt-4 flex gap-2">
          <Link
            href="/login"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
          >
            Switch account
          </Link>
          <Link
            href="/contact"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
