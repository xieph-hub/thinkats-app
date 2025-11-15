export default function ClientSettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6">
        <h2 className="text-xl font-semibold mb-2">Settings</h2>
        <p className="text-sm text-neutral-400 mb-4">
          Company profile, team members and billing preferences will live here.
        </p>
        <ul className="list-disc pl-5 text-xs text-neutral-400 space-y-1">
          <li>Company name, logo, description, website</li>
          <li>Client users and roles (Owner, Hiring Manager, Viewer)</li>
          <li>Billing and invoicing preferences (later)</li>
        </ul>
      </section>
    </div>
  );
}
