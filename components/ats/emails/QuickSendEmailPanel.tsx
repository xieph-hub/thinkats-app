// components/ats/emails/QuickSendEmailPanel.tsx
"use client";

import { useEffect, useState, useTransition, FormEvent } from "react";

type UiTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  templateType: string | null;
  isDefault: boolean;
};

type Props = {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
};

export default function QuickSendEmailPanel({
  candidateId,
  candidateName,
  candidateEmail,
}: Props) {
  const [templates, setTemplates] = useState<UiTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | null
  >(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/ats/email-templates", {
          method: "GET",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(
            (data && data.error) || "Failed to load templates",
          );
        }
        if (cancelled) return;

        const templates: UiTemplate[] = data.templates || [];
        setTemplates(templates);

        // Pick default / first template
        const defaultTpl =
          templates.find((t) => t.isDefault) ?? templates[0] ?? null;
        if (defaultTpl) {
          setSelectedTemplateId(defaultTpl.id);
          applyTemplate(defaultTpl);
        }
      } catch (err: any) {
        console.error("Quick send: load templates error:", err);
        if (!cancelled) {
          setError(
            err?.message || "Could not load templates for quick send",
          );
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function applyTemplate(tpl: UiTemplate | null) {
    if (!tpl) {
      setSubject("");
      setBody("");
      return;
    }

    const replacedSubject = tpl.subject
      .replace("{candidate_name}", candidateName)
      .replace("{job_title}", "{job_title}");
    const replacedBody = tpl.body
      .replace("{candidate_name}", candidateName)
      .replace("{job_title}", "{job_title}");

    setSubject(replacedSubject);
    setBody(replacedBody);
  }

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);
    const tpl =
      templates.find((t) => t.id === templateId) ?? null;
    applyTemplate(tpl);
    setMessage(null);
    setError(null);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!trimmedSubject || !trimmedBody) {
      setError("Subject and body are required.");
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/ats/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: candidateEmail,
            subject: trimmedSubject,
            body: trimmedBody,
            candidateId,
            templateId: selectedTemplateId,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(
            (data && data.error) || "Failed to send email",
          );
        }

        setMessage("Email sent.");
      } catch (err: any) {
        console.error("Quick send: send error:", err);
        setError(err?.message || "Failed to send email");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Quick email to candidate
        </h2>
        {isPending && (
          <span className="text-[10px] text-slate-400">
            Sending…
          </span>
        )}
      </div>

      <p className="mb-2 text-[11px] text-slate-500">
        Send a one-off email straight from the ATS using your templates.
      </p>

      {error && (
        <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
          {message}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-600">
            Template
          </label>
          <select
            value={selectedTemplateId ?? ""}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
          >
            {templates.length === 0 && (
              <option value="">No templates yet</option>
            )}
            {templates.length > 0 && (
              <>
                <option value="">
                  (Start from blank – keep subject/body)
                </option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                    {tpl.isDefault ? " · Default" : ""}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-600">
            To
          </label>
          <input
            type="email"
            value={candidateEmail}
            readOnly
            className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-800"
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
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-600">
            Body
          </label>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending || !subject.trim() || !body.trim()}
            className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Send email
          </button>
        </div>
      </form>
    </div>
  );
}
