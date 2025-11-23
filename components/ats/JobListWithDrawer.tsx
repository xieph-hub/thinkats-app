// components/ats/JobListWithDrawer.tsx
"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";

type Job = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  salary?: string;
  workMode?: "Remote" | "Hybrid" | "On-site" | "Flexible";
  status: "open" | "on_hold" | "closed" | "draft";
  createdAt: string;
  description: string;
  requirements: string;
};

type Props = {
  jobs: Job[];
  onEditJob?: (jobId: string) => void;
  onViewApplications?: (jobId: string) => void;
  onDeleteJob?: (jobId: string) => Promise<void> | void;
};

export function JobListWithDrawer({
  jobs,
  onEditJob,
  onViewApplications,
  onDeleteJob,
}: Props) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRowClick = (job: Job) => {
    setSelectedJob(job);
  };

  const openDeleteModal = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete || !onDeleteJob) {
      setIsDeleteModalOpen(false);
      return;
    }
    try {
      setIsDeleting(true);
      await onDeleteJob(jobToDelete.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
      if (selectedJob && selectedJob.id === jobToDelete.id) {
        setSelectedJob(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Jobs</h1>
          <p className="text-xs text-slate-500">
            Manage open roles, drafts, and archived jobs.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c]"
          onClick={() => onEditJob?.("new")}
        >
          + Create new job
        </button>
      </div>

      {/* Job list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">
          <div className="col-span-4">Role</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Created</div>
        </div>

        {jobs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            No jobs yet. Click{" "}
            <span className="font-semibold text-[#172965]">
              “Create new job”
            </span>{" "}
            to add your first role.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const isActive = selectedJob?.id === job.id;

              return (
                <li
                  key={job.id}
                  className={`cursor-pointer px-4 py-3 text-[13px] transition ${
                    isActive
                      ? "bg-[#172965]/4"
                      : "hover:bg-slate-50 active:bg-slate-100/70"
                  }`}
                  onClick={() => handleRowClick(job)}
                >
                  <div className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4">
                      <div className="font-semibold text-slate-900">
                        {job.title}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-slate-500">
                        {job.workMode && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">
                            {job.workMode}
                          </span>
                        )}
                        {job.salary && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">
                            {job.salary}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-[12px] text-slate-700">
                      {job.companyName}
                    </div>
                    <div className="col-span-2 text-[12px] text-slate-700">
                      {job.location}
                    </div>
                    <div className="col-span-2">
                      <StatusPill status={job.status} />
                    </div>
                    <div className="col-span-2 text-right text-[11px] text-slate-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Drawer for job preview */}
      <Drawer
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title}
        size="md"
      >
        {selectedJob && (
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                {selectedJob.companyName}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-700">
                  📍 {selectedJob.location}
                </span>
                {selectedJob.workMode && (
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-700">
                    🌍 {selectedJob.workMode}
                  </span>
                )}
                {selectedJob.salary && (
                  <span className="inline-flex items-center rounded-full bg-[#FFC000]/15 px-2 py-0.5 text-slate-800">
                    💰 {selectedJob.salary}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <div className="flex items-center justify-between">
                <StatusPill status={selectedJob.status} />
                <span>
                  Created{" "}
                  {new Date(selectedJob.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <section>
              <h3 className="text-xs font-semibold text-slate-900">
                Role overview
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {selectedJob.description}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-slate-900">
                Key requirements
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {selectedJob.requirements}
              </p>
            </section>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#111c4c]"
                onClick={() => selectedJob && onEditJob?.(selectedJob.id)}
              >
                Edit job
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() =>
                  selectedJob && onViewApplications?.(selectedJob.id)
                }
              >
                View applications
              </button>
              {onDeleteJob && (
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  onClick={() => selectedJob && openDeleteModal(selectedJob)}
                >
                  Delete job
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete confirm modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setJobToDelete(null);
          }
        }}
        title="Delete job"
      >
        <p className="mt-1 text-sm text-slate-600">
          You&apos;re about to permanently delete{" "}
          <span className="font-semibold">
            {jobToDelete?.title ?? "this job"}
          </span>
          . This will not remove existing applications, but the role will no
          longer appear in your ATS.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              if (!isDeleting) {
                setIsDeleteModalOpen(false);
                setJobToDelete(null);
              }
            }}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={confirmDelete}
            className="inline-flex items-center rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-70"
          >
            {isDeleting ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function StatusPill({ status }: { status: Job["status"] }) {
  const map: Record<Job["status"], { label: string; className: string }> = {
    open: {
      label: "Open",
      className:
        "bg-[#64C247]/15 text-[#306B34] border border-[#64C247]/40",
    },
    on_hold: {
      label: "On hold",
      className:
        "bg-yellow-50 text-[#725400] border border-[#FFC000]/50",
    },
    closed: {
      label: "Closed",
      className:
        "bg-slate-100 text-slate-700 border border-slate-200",
    },
    draft: {
      label: "Draft",
      className:
        "bg-slate-50 text-slate-600 border border-slate-200",
    },
  };

  const cfg = map[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// exported type so server-side page can shape Supabase rows
export type AtsJobListItem = Job;
