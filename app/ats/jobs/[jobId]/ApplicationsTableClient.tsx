// inside your row render in ApplicationsTableClient

const cvHref =
  application.cvUrl &&
  (application.cvUrl.startsWith("http://") ||
    application.cvUrl.startsWith("https://"))
    ? application.cvUrl
    : null;

<td className="px-4 py-3 align-top text-xs">
  {cvHref ? (
    <a
      href={cvHref}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-[#172965] hover:border-[#172965] hover:bg-slate-50"
    >
      Open CV
    </a>
  ) : (
    <span className="text-slate-400">No CV</span>
  )}
</td>
