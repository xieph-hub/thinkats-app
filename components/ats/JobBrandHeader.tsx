// components/ats/JobBrandHeader.tsx
import Image from "next/image";

type JobBrandHeaderProps = {
  job: any;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function JobBrandHeader({ job }: JobBrandHeaderProps) {
  const tenant = job.tenant as any | undefined;
  const client = job.clientCompany as any | undefined;

  const tenantName = tenant?.name ?? null;
  const tenantLogoUrl = tenant?.logoUrl ?? tenant?.logo_url ?? null;
  const clientName = client?.name ?? null;
  const clientLogoUrl = client?.logoUrl ?? client?.logo_url ?? null;

  const location = job.location ?? null;
  const workMode = job.workMode ?? job.work_mode ?? null;
  const employmentType =
    job.employmentType ?? job.employment_type ?? null;
  const created = formatDate(job.createdAt ?? job.created_at);

  const totalApplications = (job.applications ?? []).length;

  return (
    <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: logos + title + meta */}
        <div className="flex items-start gap-3">
          <BrandStack
            tenantName={tenantName}
            tenantLogoUrl={tenantLogoUrl}
            clientName={clientName}
            clientLogoUrl={clientLogoUrl}
          />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
              {job.title}
            </h1>
            <p className="mt-1 text-[11px] text-slate-600">
              {clientName || tenantName || "Confidential search"}
              {clientName && tenantName && (
                <>
                  {" "}
                  · via{" "}
                  <span className="font-medium text-slate-800">
                    {tenantName}
                  </span>
                </>
              )}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
              {location && (
                <MetaPill icon="📍" label={location} tone="primary" />
              )}
              {workMode && <MetaPill icon="🌐" label={workMode} />}
              {employmentType && (
                <MetaPill icon="💼" label={employmentType} />
              )}
              {created && (
                <MetaPill icon="🕒" label={`Opened ${created}`} />
              )}
            </div>
          </div>
        </div>

        {/* Right: quick stats */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Total applications
            </p>
            <p className="mt-0.5 text-lg font-semibold text-[#172965]">
              {totalApplications}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="max-w-[140px] text-[10px] text-slate-500">
            Powered by{" "}
            <span className="font-semibold text-[#172965]">
              ThinkATS
            </span>
            . Move candidates through stages from this workspace.
          </div>
        </div>
      </div>
    </header>
  );
}

function BrandStack(props: {
  tenantName: string | null;
  tenantLogoUrl: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;
}) {
  const { tenantName, tenantLogoUrl, clientName, clientLogoUrl } = props;

  const tenantInitial =
    (tenantName?.charAt(0)?.toUpperCase?.() as string) || "T";
  const clientInitial =
    (clientName?.charAt(0)?.toUpperCase?.() as string) || "C";

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        <BrandAvatar
          size="md"
          logoUrl={tenantLogoUrl}
          fallback={tenantInitial}
          tint="blue"
        />
        {clientName && (
          <BrandAvatar
            size="sm"
            logoUrl={clientLogoUrl}
            fallback={clientInitial}
            tint="green"
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-900">
          {clientName || tenantName || "Confidential"}
        </span>
        {clientName && tenantName && (
          <span className="text-[10px] text-slate-500">
            Workspace: {tenantName}
          </span>
        )}
      </div>
    </div>
  );
}

function BrandAvatar(props: {
  logoUrl: string | null;
  fallback: string;
  size?: "md" | "sm";
  tint?: "blue" | "green";
}) {
  const { logoUrl, fallback, size = "md", tint = "blue" } = props;

  const sizeClasses =
    size === "md" ? "h-9 w-9 text-[11px]" : "h-7 w-7 text-[10px]";
  const bgClass =
    tint === "blue"
      ? "bg-[#172965]/5 text-[#172965]"
      : "bg-[#64C247]/10 text-[#306B34]";

  if (logoUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-md border border-slate-200 bg-white ${sizeClasses}`}
      >
        <Image
          src={logoUrl}
          alt="Logo"
          fill
          sizes={size === "md" ? "36px" : "28px"}
          className="object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-md border border-slate-200 ${bgClass} ${sizeClasses}`}
    >
      {fallback}
    </div>
  );
}

function MetaPill({
  icon,
  label,
  tone = "default",
}: {
  icon: string;
  label: string;
  tone?: "default" | "primary";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px]";
  const palette =
    tone === "primary"
      ? "border border-[#172965]/15 bg-[#172965]/5 text-[#172965]"
      : "border border-slate-200 bg-white/70 text-slate-700";
  return (
    <span className={`${base} ${palette}`}>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}
