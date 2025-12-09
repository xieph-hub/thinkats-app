// components/ats/tenants/TenantActionsMenu.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tenantId: string;
  canDelete: boolean;
  currentStatus: string | null;
};

export default function TenantActionsMenu({
  tenantId,
  canDelete,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const normalizedStatus = (currentStatus || "active").toLowerCase();

  async function callAction(body: { action: string; status?: string }) {
    try {
      setIsBusy(true);
      const res = await fetch(`/api/ats/tenants/${tenantId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("Tenant status change failed", await res.text());
        // You can swap this for a toast later
        alert("Could not update workspace. Please try again.");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("Tenant actions error", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  const isSuspended = normalizedStatus === "suspended";
  const isArchived = normalizedStatus === "archived";

  return (
    <div className="flex flex-wrap items-center gap-1 text-[10px]">
      {/* Suspend / Activate toggle */}
      <button
        type="button"
        disabled={isBusy || isArchived}
        onClick={() =>
          callAction({
            action: "update_status",
            status: isSuspended ? "active" : "suspended",
          })
        }
        className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSuspended ? "Activate" : "Suspend"}
      </button>

      {/* Archive */}
      <button
        type="button"
        disabled={isBusy || isArchived}
        onClick={() =>
          callAction({
            action: "update_status",
            status: "archived",
          })
        }
        className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Archive
      </button>

      {/* Delete (only when canDelete = true) */}
      <button
        type="button"
        disabled={isBusy || !canDelete}
        onClick={() => {
          if (
            !canDelete ||
            !window.confirm(
              "This will permanently delete the workspace (if empty). Continue?",
            )
          ) {
            return;
          }
          callAction({ action: "delete" });
        }}
        className="rounded-full border border-red-200 bg-white px-2 py-0.5 font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        title={
          canDelete
            ? "Delete workspace"
            : "You can only delete a workspace with no jobs, clients or candidates."
        }
      >
        Delete
      </button>
    </div>
  );
}
