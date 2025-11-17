// app/components/Hero.tsx
"use client";

export default function Hero() {
  return (
    <section
      id="hero"
      className="bg-[#020b24] text-slate-50 scroll-mt-24"
    >
      <div className="mx-auto max-w-5xl px-4 pt-20 pb-24 text-center sm:pt-24 sm:pb-28">
        {/* Top pill */}
        <p className="inline-flex items-center justify-center rounded-full border border-slate-500/60 bg-slate-900/60 px-4 py-1 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-slate-100">
          Student-first budgeting system
        </p>

        {/* Main headline */}
        <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-50">
          <span className="block">Take control of your cash,</span>
          <span className="block mt-1">one student budget at a time.</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-4 sm:mt-5 mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-slate-200/90">
          A simple weekly and monthly cash planning system built by an accounting
          mind. See your income, expenses, and leftover cash clearly so you can
          make real decisions without subscriptions or paywalls.
        </p>

        {/* Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#weekly-cash-plan"
            className="inline-flex items-center justify-center rounded-full bg-slate-50 px-7 py-3 text-sm font-semibold text-slate-900 shadow-md shadow-slate-950/40 transition hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020b24]"
          >
            Start your cash plan
          </a>
          <a
            href="#tools"
            className="inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-transparent px-7 py-3 text-sm font-semibold text-slate-50/90 transition hover:bg-slate-900/60 hover:border-slate-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020b24]"
          >
            Explore the tools
          </a>
        </div>

        <p className="mt-3 text-[0.7rem] sm:text-xs text-slate-400">
          Takes about 2 minutes to get your first draft plan.
        </p>
      </div>
    </section>
  );
}
