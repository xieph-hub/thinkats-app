// components/ats/jobs/ApplicationEmailDrawer.tsx
"use client";

import { useState } from "react";

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

type ApplicationContext = {
  id: string;
  jobId: string;
  candidateId: string | null;
  candidateName: string;
  candidateEmail: string | null;
  jobTitle: string;
  clientName: string | null;
  stage: string | null;
  status: string | null;
};

type Props = {
  tenantName: string;
  templates: Template[];
  application: ApplicationContext;
};

function applyTemplateTokens(
  text: string,
  replacements: Record<string, string>,
): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    const token = `{{${key}}}`;
    result = result.split(token).join(value);
  }
  return result;
}

export default function ApplicationEmailDrawer({
  tenantName,
  templates,
  application,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [toEmail, setToEmail] = useState(application.candidateEmail || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);

    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    const fullName = application.candidateName || "";
    const firstName =
      fullName.trim().split(/\s+/)[0] || fullName || "there";

    const replacements: Record<string, string> = {
      candidate_name: fullName,
      candidate_first_name: firstName,
      candidate_email: application.candidateEmail || "",
      job_title: application.jobTitle || "",
      client_name: application.clientName || "",
      tenant_name: tenantName,
      application_stage: application.stage || "",
      application_status: application.status || "",
    };

    setSubject(applyTemplateTokens(tpl.subject, replacements));
    setBody(applyTemplateTokens(tpl.body, replacements));
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex h-7 items-center rounded-full border border-slate-500 bg-slate-900 px-2.5 text-[10px] font-medium text-slate-50 hover:bg-slate-800"
      >
        Send email
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={handleClose}
          />

          {/* Drawer panel */}
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Email {application.candidateName}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {application.jobTitle}
                  {application.clientName
                    ? ` · ${application.clientName}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 text-xs text-slate-700">
              {/* Template picker */}
              {templates.length > 0 ? (
                <div className="mb-3 space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  >
                    <option value="">No template</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="mb-3 text-[11px] text-slate-400">
                  No email templates yet. You can still write a manual
                  email below.
                </p>
              )}

              {/* Compose form */}
              <form
                action="/api/ats/email/send"
                method="POST"
                className="space-y-2"
              >
                <input
                  type="hidden"
                  name="candidateId"
                  value={application.candidateId ?? ""}
                />
                <input
                  type="hidden"
                  name="applicationId"
                  value={application.id}
                />
                <input
                  type="hidden"
                  name="jobId"
                  value={application.jobId}
                />
                <input
                  type="hidden"
                  name="templateId"
                  value={selectedTemplateId}
                />
                <input
                  type="hidden"
                  name="redirectTo"
                  value={`/ats/jobs/${application.jobId}`}
                />

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    To
                  </label>
                  <input
                    type="email"
                    name="toEmail"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Body
                  </label>
                  <textarea
                    name="body"
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-800"
                    placeholder="Write your email…"
                    required
                  />
                </div>

                <p className="text-[10px] text-slate-400">
                  Templates support{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{candidate_name}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{candidate_first_name}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{job_title}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{client_name}}"}
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{tenant_name}}"}
                  </code>
                  .
                </p>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-8 items-center rounded-full border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
                  >
                    Send email
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
