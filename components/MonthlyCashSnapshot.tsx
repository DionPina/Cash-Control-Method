"use client";

type MonthlyCashSnapshotProps = {
  income: number; // from Weekly Cash Plan
  plannedSpending: number; // from Expense Categories total
  savings: number; // from Weekly Cash Plan savings
};

export default function MonthlyCashSnapshot({
  income,
  plannedSpending,
  savings,
}: MonthlyCashSnapshotProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  const totalAllocated = plannedSpending + savings;
  const cashLeftAfterEverything = income - totalAllocated;

  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const spendingRate = income > 0 ? (plannedSpending / income) * 100 : 0;
  const leftoverRate =
    income > 0 ? (cashLeftAfterEverything / income) * 100 : 0;

  return (
    <section
      id="monthly-cash-snapshot"
      className="mx-auto max-w-5xl px-4 py-10 md:py-14"
    >
      <div className="rounded-3xl border border-[#decfb0] bg-[#fdfaf4] p-6 shadow-sm md:p-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#7a6a48]">
          Step 2
        </p>
        <h2 className="mt-2 text-2xl font-semibold md:text-3xl text-[#020b24]">
  Monthly Cash Snapshot
</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 md:text-base">
          This is your big-picture view: how your monthly income breaks down
          into spending, savings, and leftover cash after everything. Numbers
          pull in automatically from your Weekly Cash Plan and Expense
          Categories.
        </p>

        {/* Top totals */}
        <div className="mt-5 space-y-2.5 text-sm md:text-base">
          <div className="flex justify-between">
            <span className="text-slate-700">
              Monthly income (from Weekly Cash Plan)
            </span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(income || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">
              Planned spending (from Categories)
            </span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(plannedSpending || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">Savings / extra debt</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(savings || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">Cash left after everything</span>
            <span
              className={
                "font-semibold " +
                (cashLeftAfterEverything >= 0
                  ? "text-emerald-700"
                  : "text-rose-600")
              }
            >
              {formatCurrency(cashLeftAfterEverything || 0)}
            </span>
          </div>
        </div>

        {/* Rates + legend */}
        <div className="mt-6 grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[#decfb0] bg-[#f7f3ea] px-4 py-3">
            <div className="mb-1.5 flex justify-between text-sm md:text-base">
              <span className="font-medium text-slate-700">Savings rate</span>
              <span className="font-semibold text-emerald-700">
                {savingsRate.toFixed(0)}% of income
              </span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="font-medium text-slate-700">Spending rate</span>
              <span className="font-semibold text-slate-900">
                {spendingRate.toFixed(0)}% of income
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm md:text-base">
              <span className="font-medium text-slate-700">Leftover rate</span>
              <span
                className={
                  "font-semibold " +
                  (cashLeftAfterEverything >= 0
                    ? "text-sky-700"
                    : "text-rose-600")
                }
              >
                {leftoverRate.toFixed(0)}% of income
              </span>
            </div>
            <p className="mt-2 text-[0.7rem] leading-snug text-slate-600 md:text-xs">
              As a simple target, many students aim for at least{" "}
              <span className="font-semibold">10–20% saving</span> and some
              positive leftover each month.
            </p>
          </div>

          <div className="rounded-2xl border border-[#decfb0] bg-[#f7f3ea] px-4 py-3 text-xs text-slate-700 md:text-sm">
            <p className="mb-2 font-medium">Legend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-slate-700" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-amber-600" />
                <span>Planned spending (categories)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                <span>Savings / extra debt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-sky-500" />
                <span>Leftover cash</span>
              </div>
            </div>
            <p className="mt-3 text-[0.7rem] leading-snug text-slate-600 md:text-xs">
              Think of this as your personal “mini CFO dashboard” for the
              month.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
