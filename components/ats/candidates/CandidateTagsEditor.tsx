// components/ats/candidates/CandidateTagsEditor.tsx
"use client";

type Tag = {
  id: string;
  name: string;
  color?: string | null;
};

type Props = {
  candidateId: string;
  initialTags: Tag[];
};

/**
 * Simple tags editor for a candidate.
 *
 * - Renders existing tags as chips
 * - Uses a plain <form> POST to /api/ats/candidates/[candidateId]/tags
 *   so it works with the existing server route that expects formData.
 * - After submit, Next.js will reload the page and show the updated tags.
 */
export default function CandidateTagsEditor({ candidateId, initialTags }: Props) {
  const hasTags = initialTags && initialTags.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Tags
        </h2>
        {hasTags && (
          <span className="text-[11px] text-slate-400">
            {initialTags.length}{" "}
            {initialTags.length === 1 ? "tag" : "tags"}
          </span>
        )}
      </div>

      {/* Existing tags */}
      <div className="mb-3 flex flex-wrap gap-1">
        {hasTags ? (
          initialTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
              style={
                tag.color
                  ? {
                      backgroundColor: tag.color,
                      color: "#0f172a",
                    }
                  : undefined
              }
            >
              {tag.name}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-slate-400">
            No tags yet. Use the box below to add some.
          </span>
        )}
      </div>

      {/* Add tag form — posts to the same endpoint your old page used */}
      <form
        action={`/api/ats/candidates/${candidateId}/tags`}
        method="POST"
        className="mt-1 flex flex-wrap gap-2"
      >
        <input
          type="text"
          name="tagName"
          placeholder="Add tag…"
          className="h-8 min-w-[140px] flex-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
          required
        />
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
        >
          Add tag
        </button>
      </form>
    </section>
  );
}
