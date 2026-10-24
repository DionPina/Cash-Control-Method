import CashControlApp from "@/components/accounting/CashControlApp";
import Hero from "@/components/Hero";

export default function HomePage() {
  return (
    <>
      <Hero />

      <section id="app" className="scroll-mt-24">
        <CashControlApp />
      </section>

      <section
        id="method"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            The Cash Control Method
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            A simple rhythm for staying in control
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Make a plan, record what happens, and check that everything looks
            right. Cash Control turns those records into useful weekly guidance
            and a deeper monthly understanding of your finances.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["1. Plan", "Give your available money a clear purpose."],
              ["2. Record", "Enter each money event once, using plain language."],
              ["3. Review", "Use weekly check-ins and monthly insights to decide what comes next."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-950">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            Built with care for real student decisions
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Cash Control Method was created by Dion Pina to apply accounting
            and business concepts to everyday student finances. The interface
            stays personal and approachable while sound accounting supports
            every balance, plan, comparison, and report behind the scenes.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs leading-5 text-slate-500 sm:px-6 lg:px-8">
          Cash Control Method is an educational recordkeeping tool. It does not
          provide personalized financial, investment, legal, or tax advice.
        </div>
      </footer>
    </>
  );
}
