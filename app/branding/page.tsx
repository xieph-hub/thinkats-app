// app/branding/page.tsx (example preview page)
import ThinkATSLogo from "@/components/branding/ThinkATSLogo";

export default function BrandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 space-y-10">
      <section>
        <h1 className="text-2xl font-semibold mb-4">ThinkATS Logo – Primary</h1>
        <div className="inline-flex items-center gap-6 rounded-2xl bg-white p-6 shadow-sm">
          <ThinkATSLogo className="w-56 h-auto" variant="primary" showTagline />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Mono (Dark) Variant</h2>
        <div className="inline-flex items-center gap-6 rounded-2xl bg-white p-6 shadow-sm">
          <ThinkATSLogo
            className="w-56 h-auto"
            variant="mono"
            monoColor="#172965"
            showTagline
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Mono (Light on Dark)</h2>
        <div className="inline-flex items-center gap-6 rounded-2xl bg-slate-900 p-6 rounded-2xl">
          <ThinkATSLogo
            className="w-56 h-auto"
            variant="mono"
            monoColor="#FFFFFF"
            showTagline
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Watermark Variant</h2>
        <div className="relative overflow-hidden rounded-2xl bg-white p-10 shadow-sm">
          {/* Watermark-style logo */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <ThinkATSLogo
              className="w-[26rem] h-auto"
              variant="watermark"
              monoColor="#172965"
            />
          </div>

          {/* Example foreground content */}
          <div className="relative space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Example page
            </p>
            <h3 className="text-2xl font-semibold text-slate-900">
              Candidate pipeline overview
            </h3>
            <p className="max-w-xl text-slate-600">
              This is how the watermark would sit behind content on ThinkATS
              pages, PDFs, reports, etc.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
