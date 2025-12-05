// app/ats/emails/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import EmailTemplatesManager from "@/components/ats/emails/EmailTemplatesManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Emails",
  description: "Manage email templates and see recent outbound emails.",
};

export default async function EmailsPage() {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  const templates = await prisma.emailTemplate.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  const sentEmails = await prisma.sentEmail.findMany({
    where: { tenantId: tenant.id },
    include: {
      candidate: true,
      job: true,
      template: true,
    },
    orderBy: { sentAt: "desc" },
    take: 25,
  });

  const uiTemplates = templates.map((t) => ({
    id: t.id,
    name: t.name,
    subject: t.subject,
    body: t.body,
    templateType: t.templateType ?? null,
    isDefault: t.isDefault,
  }));

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Email templates &amp; outbound comms
            </h1>
            <p className="text-xs text-slate-500">
              Standardise your emails to candidates &amp; clients, and see
              what&apos;s going out of the ATS.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
            Tenant: <span className="font-medium">{tenant.name}</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 py-4 lg:flex-row">
        {/* Left: templates manager */}
        <section className="flex min-w-0 flex-1 flex-col">
          <EmailTemplatesManager initialTemplates={uiTemplates} />
        </section>

        {/* Right: recent emails */}
        <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 lg:w-80">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent emails
            </h2>
            <span className="text-[11px] text-slate-500">
              Last {sentEmails.length}
            </span>
          </div>

          {sentEmails.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-500">
              No emails sent yet from this workspace.
            </div>
          ) : (
            <div className="space-y-2">
              {sentEmails.map((email) => (
                <article
                  key={email.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                    <span className="truncate">
                      To:{" "}
                      <span className="font-medium text-slate-800">
                        {email.toEmail}
                      </span>
                    </span>
                    <span>
                      {email.sentAt.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="mb-0.5 text-[11px] font-semibold text-slate-900 line-clamp-1">
                    {email.subject}
                  </div>
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    {email.candidate && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {email.candidate.fullName}
                      </span>
                    )}
                    {email.job && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {email.job.title}
                      </span>
                    )}
                    {email.template && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Template: {email.template.name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Status: {email.status}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[11px] text-slate-600">
                    {email.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
