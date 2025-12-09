// components/careers/CareersShell.tsx
import type { ReactNode } from "react";
import Image from "next/image";
import type { Tenant, ClientCompany, CareerSiteSettings } from "@prisma/client";

type CareersShellProps = {
  tenant: Tenant | null;
  clientCompany?: ClientCompany | null;
  settings?: CareerSiteSettings | null;
  host: string;
  isAppHost: boolean;
  isTenantHost: boolean;
  isCareersiteHost: boolean;
  children: ReactNode;
};

function getInitials(label: string): string {
  if (!label) return "";
  const parts = label.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function CareersShell({
  tenant,
  clientCompany,
  settings,
  host,
  isAppHost,
  isTenantHost,
  isCareersiteHost,
  children,
}: CareersShellProps) {
  const brandName =
    clientCompany?.name ??
    tenant?.name ??
    (isAppHost ? "ThinkATS Careers" : host.replace(/^www\./i, ""));

  const logoSrc =
    settings?.logoUrl ?? clientCompany?.logoUrl ?? tenant?.logoUrl ?? null;

  const primaryColor = settings?.primaryColorHex ?? "#172965";
  const accentColor = settings?.accentColorHex ?? "#FFC000";
  const heroBackground = settings?.heroBackgroundHex ?? "#F4F5FB";

  const onThinkatsDomain = host.endsWith("thinkats.com");
  const planTier = (tenant as any)?.planTier ?? "STARTER";

  // Simple first-pass rule:
  // - If on *.thinkats.com and NOT ENTERPRISE plan → show "Powered by ThinkATS"
  // - If ENTERPRISE + custom domain → hide
  const canHideBrand = planTier === "ENTERPRISE" && !onThinkatsDomain;
  const showPoweredBy = onThinkatsDomain && !canHideBrand;

  const isTenantCareers =
    isTenantHost || isCareersiteHost || (!!tenant && onThinkatsDomain);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {/* Top shell / nav */}
        <header className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 shadow-lg shadow-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-slate-800 ring-1 ring-slate-700">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={brandName}
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-slate-100">
                  {getInitials(brandName)}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight text-slate-50">
                {brandName}
              </p>
              {isTenantCareers && (
                <p className="text-[11px] text-slate-400">
                  Careers portal ·{" "}
                  <span className="font-mono text-slate-300">{host}</span>
                </p>
              )}
              {!isTenantCareers && (
                <p className="text-[11px] text-slate-400">
                  Global careers powered by ThinkATS
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showPoweredBy && (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-medium text-slate-300">
                Powered by <span className="font-semibold">ThinkATS</span>
              </span>
            )}
          </div>
        </header>

        {/* Main white card with tenant branding */}
        <main
          className="rounded-2xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-950/20"
          style={{
            // use tenant hero background subtly at the top edge
            backgroundImage: `linear-gradient(to bottom, ${heroBackground} 0, rgba(255,255,255,0.98) 140px)`,
          }}
        >
          {/* Accent border strip */}
          <div
            className="h-1 rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
