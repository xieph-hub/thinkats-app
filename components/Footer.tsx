export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#172965] text-white">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Resourcin" className="w-8 h-8" />
            <span className="font-semibold">Resourcin</span>
          </div>
          <p className="mt-3 text-sm opacity-90">Boutique HR & recruitment partner.</p>
        </div>
        <div>
          <p className="font-semibold">Site</p>
          <ul className="mt-2 text-sm space-y-2">
            {[
              ["Home","/"],["Services","/services"],["Jobs","/jobs"],
              ["Insights","/insights"],["About","/about"],["Contact","/contact"]
            ].map(([label,href])=>(
              <li key={href}><a className="hover:underline opacity-90 hover:opacity-100" href={href}>{label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Legal</p>
          <ul className="mt-2 text-sm space-y-2">
            <li><a className="hover:underline opacity-90 hover:opacity-100" href="#">Terms</a></li>
            <li><a className="hover:underline opacity-90 hover:opacity-100" href="#">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs flex items-center justify-between opacity-90">
          <p>© {year} Resourcin Human Capital Advisors.</p>
          <p>Made with care.</p>
        </div>
      </div>
    </footer>
  )
}
