export default function Hero() {
  return (
    <section id="hero" className="scroll-mt-24 bg-[#020b24] text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <p className="inline-flex rounded-full border border-slate-700 bg-slate-900/50 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-200">
          Made for college life
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Understand your money. Make confident decisions.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base md:text-lg md:leading-8">
          See what comes in, where it goes, and what needs your attention
          through quick daily check-ins, weekly pacing, and monthly reviews.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#app"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#020b24] shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020b24]"
          >
            Get started
          </a>
          <a
            href="#method"
            className="inline-flex items-center justify-center rounded-full border border-slate-400/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020b24]"
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Your records stay in this browser on this device.
        </p>
      </div>
    </section>
  );
}
