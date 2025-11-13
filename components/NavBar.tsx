
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl grid place-items-center bg-brand-blue text-white font-bold shadow-soft">R</div>
          <span className="text-lg font-semibold tracking-tight">Resourcin</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-brand-blue">Home</Link>
          <Link href="/services" className="hover:text-brand-blue">Services</Link>
          <Link href="/jobs" className="hover:text-brand-blue">Jobs</Link>
          <Link href="/insights" className="hover:text-brand-blue">Insights</Link>
          <Link href="/about" className="hover:text-brand-blue">About</Link>
          <Link href="/contact" className="hover:text-brand-blue">Contact</Link>
          <Link href="/contact" className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-brand-blue text-white hover:opacity-90 shadow-soft">
            Request a Consultation
          </Link>
        </nav>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg border border-slate-300" aria-label="Open Menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-3 text-sm">
            <Link href="/" className="block py-2" onClick={()=>setOpen(false)}>Home</Link>
            <Link href="/services" className="block py-2" onClick={()=>setOpen(false)}>Services</Link>
            <Link href="/jobs" className="block py-2" onClick={()=>setOpen(false)}>Jobs</Link>
            <Link href="/insights" className="block py-2" onClick={()=>setOpen(false)}>Insights</Link>
            <Link href="/about" className="block py-2" onClick={()=>setOpen(false)}>About</Link>
            <Link href="/contact" className="block py-2" onClick={()=>setOpen(false)}>Contact</Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-brand-blue text-white" onClick={()=>setOpen(false)}>
              Request a Consultation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
