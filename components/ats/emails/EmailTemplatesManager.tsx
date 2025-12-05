// components/ats/emails/EmailTemplatesManager.tsx
"use client";

import { useState, useTransition, FormEvent } from "react";

type UiTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  templateType: string | null;
  isDefault: boolean;
};

type Props = {
  initialTemplates: UiTemplate[];
};

export default function EmailTemplatesManager({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<UiTemplate[]>(initialTemplates);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTemplates.find((t) => t.isDefault)?.id ??
      initialTemplates[0]?.id ??
      null,
  );
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateType, setTemplateType] = useState<string>("candidate");
  const [isDefault, setIsDefault] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // hydrate form when selection changes
  function hydrateFromTemplate(t: UiTemplate | null) {
    if (!t) {
      setName("");
      setSubject("");
      setBody("");
      setTemplateType("candidate");
      setIsDefault(false);
      return;
    }
    setName(t.name);
    setSubject(t.subject);
    setBody(t.body);
    setTemplateType(t.templateType || "candidate");
    setIsDefault(t.isDefault);
  }

  function handleSelect(templateId: string) {
    setSelectedId(templateId);
    const t = templates.find((tpl) => tpl.id === templateId) || null;
    hydrateFromTemplate(t);
    setError(null);
    setMessage(null);
  }

  function handleNew() {
    setSelectedId(null);
    hydrateFromTemplate(null);
    setError(null);
    setMessage(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!trimmedName || !trimmedSubject || !trimmedBody) {
      setError("Name, subject and body are required.");
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/ats/email-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedId,
            name: trimmedName,
            subject: trimmedSubject,
            body: trimmedBody,
            templateType,
            makeDefault: isDefault,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(
            (data && data.error) || "Failed to save template",
          );
        }

        const updated: UiTemplate[] = data.templates || [];
        setTemplates(updated);

        // If new template, move selection to it
        const createdOrUpdated = updated.find(
          (t) => t.id === data.templateId,
        );
        setSelectedId(createdOrUpdated?.id ?? null);
        hydrateFromTemplate(createdOrUpdated ?? null);
        setMessage("Template saved.");
      } catch (err: any) {
        console.error("Email template save error:", err);
        setError(err?.message || "Failed to save template");
      }
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Email templates
          </h2>
          <p className="text-[11px] text-slate-500">
            Create reusable templates for shortlists, rejections, updates,
            and offers. Use{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
              {"{candidate_name}"}
            </code>{" "}
            and{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
              {"{job_title}"}
            </code>{" "}
            in your copy.
          </p>
        </div>
        {isPending && (
          <span className="text-[10px] text-slate-400">Saving…</span>
        )}
      </div>

      <div className="flex min-h-[320px] flex-1 gap-4">
        {/* List of templates */}
        <div className="w-full max-w-xs shrink-0 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-700">
              Templates
            </span>
            <button
              type="button"
              onClick={handleNew}
              className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              + New template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">
              No templates yet. Create your first default candidate update or
              rejection email.
            </div>
          ) : (
            <div className="space-y-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelect(tpl.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] ${
                    tpl.id === selectedId
                      ? "bg-slate-900 text-slate-50"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="truncate font-medium">
                      {tpl.name}
                    </span>
                    <span
                      className={`truncate text-[10px] ${
                        tpl.id === selectedId
                          ? "text-slate-200"
                          : "text-slate-400"
                      }`}
                    >
                      {tpl.subject}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {tpl.templateType && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                          tpl.id === selectedId
                            ? "bg-slate-800 text-slate-100"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tpl.templateType}
                      </span>
                    )}
                    {tpl.isDefault && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-700">
                        Default
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
          <form className="flex h-full flex-col gap-3" onSubmit={handleSave}>
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                {message}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-[1.5fr,1fr]">
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Template name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Default rejection, Shortlist update, Offer"
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Update on your application for {job_title}"
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-600">
                    Template type
                  </label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="client">Client</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-3 w-3 rounded border-slate-300"
                  />
                  Make this the default template
                </label>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[11px] text-slate-600">
                Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[140px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800"
                placeholder={`Hi {candidate_name},

Thank you again for taking the time to apply for {job_title}. ...`}
              />
              <p className="mt-1 text-[10px] text-slate-400">
                You can use{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  {"{candidate_name}"}
                </code>{" "}
                and{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  {"{job_title}"}
                </code>{" "}
                to personalise emails.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                Save template
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
