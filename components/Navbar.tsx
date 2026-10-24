"use client";

import Image from "next/image";
import { useState } from "react";

const links = [
  { href: "#hero", label: "Home" },
  { href: "#app", label: "Your Books" },
  { href: "#method", label: "The Method" },
  { href: "#about", label: "About" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:py-3.5">
        {/* Logo + brand */}
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 md:h-10 md:w-10 overflow-hidden rounded-2xl border border-slate-200 bg-[#020b24] shadow-sm">
            <Image
              src="/cc-logo.png"
              alt="Cash Control Method logo"
              fill
              sizes="(min-width: 768px) 40px, 36px"
              className="object-contain p-1.5"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[0.65rem] font-semibold tracking-[0.25em] uppercase text-slate-500">
              Cash Control
            </span>
            <span className="text-sm md:text-base font-medium text-[#020b24]">
              Budgeting for college life
            </span>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-6 text-xs md:flex md:text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-slate-700 hover:text-slate-950 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-navigation" className="border-t border-slate-200 bg-white/95 md:hidden">
          <div className="mx-auto flex max-w-5xl flex-col px-4 py-2 text-sm">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-2 text-slate-800 hover:text-slate-950"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
