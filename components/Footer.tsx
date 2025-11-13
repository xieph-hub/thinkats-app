import { Linkedin, Twitter, Instagram, Mail, Phone } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#172965] text-white">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        {/* Brand + tiny social row */}
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Resourcin" className="w-8 h-8" />
            <span className="font-semibold">Resourcin</span>
          </div>
          <p className="mt-3 text-sm opacity-90">Connecting Talent with Opportunity, Redefining Workplaces and Careers</p>

          {/* Tiny social row */}
          <div className="mt-4 flex items-center gap-2">
            <a
              href="mailto:hello@resourcin.com"
              aria-label="Email Resourcin"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <Mail className="h-4 w-4 text-white" />
            </a>
            <a
              href="tel:+2347045582393"
              aria-label="Call Resourcin"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <Phone className="h-4 w-4 text-white" />
            </a>
            <a
              href="https://www.linkedin.com/company/resourcin"
              target="_blank" rel="noopener"
              aria-label="Resourcin on LinkedIn"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <Linkedin className="h-4 w-4 text-white" />
            </a>
            <a
              href="https://x.com/resourcinhq"
              target="_blank" rel="noopener"
              aria-label="Resourcin on X"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <Twitter className="h-4 w-4 text-white" />
            </a>
            <a
              href="https://www.instagram.com/resourcinhq/"
              target="_blank" rel="noopener"
              aria-label="Resourcin on Instagram"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <Instagram className="h-4 w-4 text-white" />
            </a>
          </div>
        </div>

        {/* Site links */}
        <div>
          <p className="font-semibold">Site</p>
          <ul className="mt-2 text-sm space-y-2">
            {[
              ["Home","/"],["Services","/services"],["Jobs","/jobs"],
              ["Insights","/insights"],["About","/about"],["Contact","/contact"]
            ].map(([label,href])=>(
              <li key={href}>
                <a className="hover:underline opacity-90 hover:opacity-100" href={href}>{label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
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
          {/* no "Made with care" text */}
        </div>
      </div>
    </footer>
  );
}
