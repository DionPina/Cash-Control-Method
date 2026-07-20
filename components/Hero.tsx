// app/components/Hero.tsx
"use client";

export default function Hero() {
  return (
    <section
      id="hero"
      className="scroll-mt-24 bg-[#020b24] text-slate-50"
    >
      <div className="mx-auto max-w-5xl px-4 pt-20 pb-20 text-center sm:pt-24 sm:pb-24">
        {/* Top pill */}
        <p className="inline-flex items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/40 px-4 py-1 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-slate-200">
          Student-first budgeting system
        </p>

        {/* Main headline */}
        <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-50">
          <span className="block">Take control of your cash,</span>
          <span className="block mt-1">one student budget at a time.</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-4 sm:mt-5 mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-slate-200">
          A simple weekly and monthly cash planning system built by an
          accounting mind. See your income, expenses, and leftover cash
          clearly so you can make real decisions without subscriptions or
          paywalls.
        </p>

        {/* Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#weekly-cash-plan"
            className="inline-flex items-center justify-center rounded-full bg-slate-50 px-6 py-3 text-sm font-semibold text-[#020b24] shadow-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020b24]"
          >
            Start your cash plan
          </a>
          <a
            href="#tools"
            className="inline-flex items-center justify-center rounded-full border border-slate-400/60 bg-transparent px-6 py-3 text-sm font-semibold text-slate-50 hover:bg-slate-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020b24]"
          >
            Explore the tools
          </a>
        </div>

        <p className="mt-3 text-[0.7rem] sm:text-xs text-slate-300">
          Takes about 2 minutes to get your first draft plan.
        </p>
      </div>
    </section>
  );
}
