// components/ApplicationNotesPanel.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Note = {
  id: string;
  body: string;
  author: string;
  createdAt: string | Date;
};

type Props = {
  applicationId: string;
  notes: Note[];
};

export default function ApplicationNotesPanel({ applicationId, notes }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError("Note cannot be empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/application-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          body,
          author,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(
          data?.message || "Could not save note. Please try again."
        );
        return;
      }

      setBody("");
      // leave author so you don't have to keep retyping your name
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Network error while saving note.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(d: string | Date) {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Notes &amp; Activity
        </h2>
        <span className="text-[11px] text-slate-400">
          {notes.length} note{notes.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-xs text-slate-500">
          No notes yet. Use this space to add interview impressions, client
          feedback, or red flags about this candidate.
        </p>
      ) : (
        <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
            >
              <p className="text-xs text-slate-800 whitespace-pre-wrap">
                {note.body}
              </p>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>{note.author}</span>
                <span>{formatDate(note.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add note form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-500">
            Add a note
          </label>
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965] resize-none"
            placeholder="Eg. Strong on stakeholder management; advise HM to probe more on compensation expectations and remote work flexibility."
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-500">
              Author (optional)
            </label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-40 rounded-full border border-slate-300 px-3 py-1.5 text-[11px] outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
              placeholder="Victor"
            />
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-medium text-white hover:bg-[#101c44] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving..." : "Save note"}
            </button>
            {error && (
              <span className="text-[10px] text-red-500 max-w-xs text-right">
                {error}
              </span>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
