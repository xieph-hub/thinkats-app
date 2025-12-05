        {/* Right column: tags + contact summary + quick email */}
        <aside className="w-full shrink-0 space-y-4 md:w-80">
          {/* Contact & links */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Profile summary
            </h2>
            <div className="space-y-2">
              {candidate.email && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">Email</span>
                  <a
                    href={`mailto:${candidate.email}`}
                    className="truncate text-[11px] font-medium text-slate-900 hover:underline"
                  >
                    {candidate.email}
                  </a>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">Phone</span>
                  <a
                    href={`tel:${candidate.phone}`}
                    className="truncate text-[11px] font-medium text-slate-900 hover:underline"
                  >
                    {candidate.phone}
                  </a>
                </div>
              )}
              {candidate.linkedinUrl && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">LinkedIn</span>
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-[11px] font-medium text-slate-900 hover:underline"
                  >
                    View profile
                  </a>
                </div>
              )}
              {candidate.cvUrl && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">CV</span>
                  <a
                    href={candidate.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-[11px] font-medium text-slate-900 hover:underline"
                  >
                    Download CV
                  </a>
                </div>
              )}
              {candidate.source && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">Source</span>
                  <span className="truncate text-[11px] font-medium text-slate-900">
                    {candidate.source}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tags editor */}
          <CandidateTagsEditor
            candidateId={candidate.id}
            initialTags={tagList}
          />

          {/* Quick send email */}
          {candidate.email && (
            <QuickSendEmailPanel
              candidateId={candidate.id}
              candidateName={candidate.fullName}
              candidateEmail={candidate.email}
            />
          )}
        </aside>
