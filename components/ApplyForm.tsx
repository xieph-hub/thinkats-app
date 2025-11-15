// components/ApplyForm.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

type ApplyFormProps = {
  jobTitle: string;
  jobSlug?: string;
};

export default function ApplyForm({ jobTitle, jobSlug }: ApplyFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const pathname = usePathname();
  const slugFromPath =
    pathname
      ?.split("?")[0]
      .split("/")
      .filter(Boolean)
      .pop() || "";

  const effectiveJobSlug = jobSlug || slugFromPath;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      if (!effectiveJobSlug && !jobTitle) {
        setIsError(true);
        setMessage(
          "We couldn’t identify the job you’re applying for. Please refresh the page and try again."
        );
        setIsSubmitting(false);
        return;
      }

      let resumeUrl: string | null = null;
      let uploadError: string | null = null;

      // 1) Try to upload CV file if present — but DO NOT block application if this fails
      if (resumeFile) {
        try {
          const uploadForm = new FormData();
          uploadForm.append("file", resumeFile);
          uploadForm.append("jobSlug", effectiveJobSlug || "general");

          const uploadRes = await fetch("/api/upload-resume", {
            method: "POST",
            body: uploadForm,
          });

          const uploadData = await uploadRes.json().catch(() => null);

          if (!uploadRes.ok || !uploadData?.ok) {
            console.error("Resume upload failed", uploadData);
            uploadError =
              uploadData?.message ||
              "Unknown storage error while uploading CV.";
          } else {
            resumeUrl = uploadData.url as string;
          }
        } catch (err: any) {
          console.error("Resume upload threw:", err);
          uploadError =
            err?.message ||
            "Unexpected error while uploading CV. Please email it instead.";
        }
      }

      // 2) Call /api/apply regardless of upload result
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobSlug: effectiveJobSlug || null,
          jobTitle: jobTitle || null,
          name,
          email,
          phone,
          location,
          resumeUrl,
          source: "website",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setIsError(true);
        setMessage(
          data?.message ||
            "We couldn’t submit your application. Please try again or email us directly."
        );
      } else {
        setIsError(false);

        if (uploadError) {
          setMessage(
            `Your application has been received, but your CV upload failed:\n${uploadError}\n\nPlease email your CV to hello@resourcin.com with the role title in the subject.`
          );
        } else {
          setMessage("Thank you — your application has been received.");
        }

        // Clear the form
        setName("");
        setEmail("");
        setPhone("");
        setLocation("");
        setResumeFile(null);
      }
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage(
        "Something went wrong while submitting your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        Apply for this role
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Submit your details and we&apos;ll review your application. You can also
        email{" "}
        <a
          href={`mailto:hello@resourcin.com?subject=${encodeURIComponent(
            `Application: ${jobTitle || "Role"}`
          )}`}
          className="text-[#172965] underline"
        >
          hello@resourcin.com
        </a>{" "}
        if you prefer.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Full name *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
              placeholder="Jane Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email address *
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
              placeholder="jane@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Phone number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
              placeholder="+234..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
              placeholder="Lagos, Nigeria"
            />
          </div>
        </div>

        {/* Resume file upload */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            CV / Resume file
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.rtf,.txt,.odt"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-slate-600
                       file:mr-3 file:rounded-full file:border-0
                       file:bg-[#172965] file:px-4 file:py-2
                       file:text-xs file:font-medium file:text-white
                       hover:file:bg-[#101c44]"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Upload your CV in PDF or Word format. Max size ~10MB is recommended.
          </p>
        </div>

        {/* Button + message */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#101c44] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit application"}
          </button>

          {message && (
            <p
              className={`whitespace-pre-line text-xs ${
                isError ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
