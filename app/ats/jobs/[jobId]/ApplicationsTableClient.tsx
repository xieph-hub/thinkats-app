"use client";

import type { AtsApplication } from "./page";

type Props = {
  applications: AtsApplication[];
};

export default function ApplicationsTableClient({ applications }: Props) {
  if (!applications || applications.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm text-slate-600">
          No applications yet. Once candidates start applying via your public
          job page, they&apos;ll appear here with their details and stage.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-4">Candidate</th>
              <th className="py-2 pr-4">Contact</th>
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Stage</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Applied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => {
              const appliedLabel = app.createdAt
                ? new Date(app.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                : "";

              return (
                <tr key={app.id} className="align-middle">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {app.fullName}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    <div className="flex flex-col">
                      <span>{app.email}</span>
                      {app.phone && (
                        <span className="text-xs text-slate-500">
                          {app.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {app.location ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {app.source ?? "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {app.stage}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-600">
                    {appliedLabel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
