"use client";

import React, { useCallback, useState, KeyboardEvent, MouseEvent } from "react";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  Building2,
  Clock,
  FolderKanban,
  Award,
  Linkedin,
  Twitter,
  Facebook,
  Mail,
  Link as LinkIcon,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  buildTwitterShareUrl,
} from "@/lib/share";

export interface JobCardData {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Remote";
  salary: string;
  applicants: number;
  postedDate: string; // ISO string or date-like
  experienceLevel: string;
  department: string;
  description: string;
  skills: string[];
  shareUrl: string;
}

export interface JobCardProps {
  job: JobCardData;
  onCardClick: () => void;
  onApply: () => void;
  onSave: () => void;
  initiallySaved?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onCardClick,
  onApply,
  onSave,
  initiallySaved = false,
}) => {
  const [isSaved, setIsSaved] = useState(initiallySaved);
  const [copied, setCopied] = useState(false);

  const handleRootKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick();
    }
  };

  const stopPropagation = (e: MouseEvent) => e.stopPropagation();

  const handleApply = (e: MouseEvent<HTMLButtonElement>) => {
    stopPropagation(e);
    onApply();
  };

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    stopPropagation(e);
    setIsSaved((prev) => !prev);
    onSave();
  };

  const handleCopyLink = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      stopPropagation(e);
      try {
        await navigator.clipboard.writeText(job.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link", err);
      }
    },
    [job.shareUrl]
  );

  const sharePayload = {
    url: job.shareUrl,
    title: job.title,
    company: job.company,
  };

  const descriptionPreview =
    job.description.length > 220
      ? `${job.description.slice(0, 220).trim()}…`
      : job.description;

  const postedLabel = (() => {
    const d = new Date(job.postedDate);
    if (Number.isNaN(d.getTime())) return job.postedDate;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  })();

  const skillColors = [
    "bg-blue-50 text-blue-700",
    "bg-emerald-50 text-emerald-700",
    "bg-amber-50 text-amber-700",
    "bg-purple-50 text-purple-700",
    "bg-sky-50 text-sky-700",
  ];

  return (
    <article
      className="group relative flex cursor-pointer flex-col rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm transition-transform transition-shadow duration-150 ease-out hover:-translate-y-0.5 hover:border-[#172965]/60 hover:shadow-lg focus-within:-translate-y-0.5 focus-within:border-[#172965]/60 focus-within:shadow-lg"
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={handleRootKeyDown}
    >
      {/* Header */}
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172965]/5">
          <Building2 className="h-5 w-5" style={{ color: "#8B5CF6" }} />
        </div>
        <div className="flex-1 space-y-1">
          <h2 className="text-sm font-semibold text-slate-900">
            {job.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} />
              <span>{job.company}</span>
            </span>
            <span className="hidden text-slate-400 sm:inline">•</span>
            <span
              className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-0.5 text-[10px] font-semibold text-[#172965]"
              aria-label={`Job type: ${job.type}`}
            >
              <Briefcase
                className="mr-1 h-3 w-3"
                style={{ color: "#92400E" }}
              />
              {job.type}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          onMouseDown={stopPropagation}
          className="ml-2 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm hover:bg-slate-50"
          aria-label={isSaved ? "Unsave job" : "Save job"}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 text-[#172965]" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </header>

      {/* Details */}
      <section className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-slate-700 sm:grid-cols-2">
        <DetailItem
          icon={
            <MapPin className="h-4 w-4" style={{ color: "#F87171" }} />
          }
          label="Location"
          value={job.location}
        />
        <DetailItem
          icon={
            <DollarSign className="h-4 w-4" style={{ color: "#059669" }} />
          }
          label="Salary"
          value={job.salary || "Not specified"}
        />
        <DetailItem
          icon={
            <Users className="h-4 w-4" style={{ color: "#2563EB" }} />
          }
          label="Applicants"
          value={
            job.applicants === 0
              ? "Be the first to apply"
              : `${job.applicants} applicant${job.applicants === 1 ? "" : "s"}`
          }
        />
        <DetailItem
          icon={
            <Clock className="h-4 w-4" style={{ color: "#F97316" }} />
          }
          label="Posted"
          value={postedLabel}
        />
        <DetailItem
          icon={
            <Award className="h-4 w-4" style={{ color: "#EAB308" }} />
          }
          label="Experience"
          value={job.experienceLevel || "Not specified"}
        />
        <DetailItem
          icon={
            <FolderKanban
              className="h-4 w-4"
              style={{ color: "#14B8A6" }}
            />
          }
          label="Department"
          value={job.department || "Not specified"}
        />
      </section>

      {/* Description */}
      <section className="mt-3 text-[12px] leading-relaxed text-slate-700">
        <p>{descriptionPreview}</p>
        <button
          type="button"
          onClick={(e) => {
            stopPropagation(e);
            onCardClick();
          }}
          className="mt-1 inline-flex items-center text-[11px] font-semibold text-[#172965] hover:underline"
        >
          Read more
        </button>
      </section>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <section className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((skill, idx) => (
            <span
              key={`${job.id}-skill-${skill}`}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                skillColors[idx % skillColors.length]
              }`}
            >
              {skill}
            </span>
          ))}
        </section>
      )}

      {/* Footer: share + actions */}
      <footer className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Social share icons */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-slate-500">
            Share:
          </span>
          <a
            href={buildLinkedInShareUrl(sharePayload)}
            target="_blank"
            rel="noreferrer"
            title="Share on LinkedIn"
            onClick={stopPropagation}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0A66C2]/10 text-[#0A66C2] transition hover:scale-110 hover:bg-[#0A66C2]/15"
          >
            <Linkedin className="h-3.5 w-3.5" />
          </a>
          <a
            href={buildTwitterShareUrl(sharePayload)}
            target="_blank"
            rel="noreferrer"
            title="Share on X"
            onClick={stopPropagation}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-black transition hover:scale-110 hover:bg-black/10"
          >
            <Twitter className="h-3.5 w-3.5" />
          </a>
          <a
            href={buildFacebookShareUrl(sharePayload)}
            target="_blank"
            rel="noreferrer"
            title="Share on Facebook"
            onClick={stopPropagation}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2] transition hover:scale-110 hover:bg-[#1877F2]/15"
          >
            <Facebook className="h-3.5 w-3.5" />
          </a>
          <a
            href={buildEmailShareUrl(sharePayload)}
            title="Share via email"
            onClick={stopPropagation}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-500/10 text-slate-600 transition hover:scale-110 hover:bg-slate-500/15"
          >
            <Mail className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            title="Copy link"
            onClick={handleCopyLink}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] transition hover:scale-110 hover:bg-[#8B5CF6]/15"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </button>
          {copied && (
            <span className="ml-1 text-[10px] font-medium text-[#306B34]">
              Copied!
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#111c4c]"
          >
            Apply now
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {isSaved ? "Saved" : "Save job"}
          </button>
        </div>
      </footer>
    </article>
  );
};

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-50">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="truncate text-[11px] text-slate-700">{value}</p>
      </div>
    </div>
  );
}
