export default function CandidateProfilePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6">
        <h2 className="text-xl font-semibold mb-2">Profile</h2>
        <p className="text-sm text-neutral-400 mb-4">
          Here we&apos;ll collect and show your structured profile: personal
          details, experience, skills, education and preferences.
        </p>
        <p className="text-xs text-neutral-500">
          In the next phase we&apos;ll turn this into a multi-section form with:
        </p>
        <ul className="list-disc pl-5 mt-2 text-xs text-neutral-400 space-y-1">
          <li>Personal &amp; contact details</li>
          <li>Professional summary &amp; work experience</li>
          <li>Education &amp; certifications</li>
          <li>Skills, tools &amp; languages</li>
          <li>Work preferences &amp; salary expectations</li>
        </ul>
      </section>
    </div>
  );
}
