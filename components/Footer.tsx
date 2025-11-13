
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl grid place-items-center bg-brand-blue text-white font-bold">R</div>
            <span className="font-semibold">Resourcin</span>
          </div>
          <p className="mt-3 text-sm text-slate-600">Boutique HR & recruitment partner.</p>
        </div>
        <div>
          <p className="font-semibold">Site</p>
          <ul className="mt-2 text-sm space-y-2 text-slate-600">
            <li><a className="hover:text-brand-blue" href="/">Home</a></li>
            <li><a className="hover:text-brand-blue" href="/services">Services</a></li>
            <li><a className="hover:text-brand-blue" href="/jobs">Jobs</a></li>
            <li><a className="hover:text-brand-blue" href="/insights">Insights</a></li>
            <li><a className="hover:text-brand-blue" href="/about">About</a></li>
            <li><a className="hover:text-brand-blue" href="/contact">Contact</a></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Legal</p>
          <ul className="mt-2 text-sm space-y-2 text-slate-600">
            <li><a className="hover:text-brand-blue" href="#">Terms</a></li>
            <li><a className="hover:text-brand-blue" href="#">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-slate-500 flex items-center justify-between">
          <p>© {year} Resourcin Human Capital Advisors.</p>
          <p>Made with care.</p>
        </div>
      </div>
    </footer>
  )
}
