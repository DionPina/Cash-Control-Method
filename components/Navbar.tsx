"use client";

import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur shadow-sm">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:py-4">
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 md:h-10 md:w-10">
            <Image
              src="/cc-logo.png"
              alt="Cash Control Method logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-base md:text-lg font-semibold tracking-tight text-slate-900">
            Cash Control Method
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
          <a
            href="#hero"
            className="transition-colors hover:text-slate-900 hover:underline underline-offset-4"
          >
            Home
          </a>
          <a
            href="#method"
            className="transition-colors hover:text-slate-900 hover:underline underline-offset-4"
          >
            The Method
          </a>
          <a
            href="#tools"
            className="transition-colors hover:text-slate-900 hover:underline underline-offset-4"
          >
            Tools
          </a>
          <a
            href="#about"
            className="transition-colors hover:text-slate-900 hover:underline underline-offset-4"
          >
            About
          </a>
          <a
            href="#contact"
            className="transition-colors hover:text-slate-900 hover:underline underline-offset-4"
          >
            Contact
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="md:hidden inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-col px-4 py-2 text-sm font-medium text-slate-700">
            <a
              href="#hero"
              className="py-2 border-b border-slate-100 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
              Home
            </a>
            <a
              href="#method"
              className="py-2 border-b border-slate-100 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
              The Method
            </a>
            <a
              href="#tools"
              className="py-2 border-b border-slate-100 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
              Tools
            </a>
            <a
              href="#about"
              className="py-2 border-b border-slate-100 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
              About
            </a>
            <a
              href="#contact"
              className="py-2 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
