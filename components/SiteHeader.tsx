"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Container from "./Container";

const <nav className="flex items-center gap-6 text-sm">
  <Link href="/">Home</Link>

  <Link href="/candidates">
    For Candidates
  </Link>

  <Link href="/employers">
    For Employers
  </Link>

  <Link href="/insights">
    Insights
  </Link>

  <Link href="/about">
    About
  </Link>

  <Link href="/contact">
    Contact
  </Link>

  <Link
    href="/login"
    className="rounded-full border border-emerald-400/80 px-3 py-1 text-[13px] font-medium text-emerald-200 hover:bg-emerald-500 hover:text-black transition"
  >
    Login
  </Link>
</nav>
          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2"
            aria-label="Toggle menu"
          >
            <span className="sr-only">Menu</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4">
            <nav className="grid gap-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
