"use client";

type MonthlyCashSnapshotProps = {
  income: number;           // from Weekly Cash Plan
  plannedSpending: number;  // from Expense Categories total
  savings: number;          // from Weekly Cash Plan savings
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
      minimumFractionDigits: 2,
    });

  const safeIncome = income > 0 ? income : 0;
  const cashLeftAfterEverything = income - plannedSpending - savings;

  const savingsRate =
    safeIncome > 0 ? (savings / safeIncome) * 100 : 0;
  const spendingRate =
    safeIncome > 0 ? (plannedSpending / safeIncome) * 100 : 0;

  return (
    <section
      id="monthly-cash-snapshot"
      className="max-w-5xl mx-auto px-4 py-10 md:py-14"
    >
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Step 2
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">
          Monthly Cash Snapshot
        </h2>
        <p className="text-sm md:text-base text-slate-700 leading-relaxed mb-6">
          This is your big-picture view: how your monthly income breaks
          down into spending, savings, and leftover cash after everything.
          Numbers pull in automatically from your Weekly Cash Plan and
          Expense Categories.
        </p>

        {/* Top totals */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm md:text-base">
            <span className="text-slate-700">
              Monthly income (from Weekly Cash Plan)
            </span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(income || 0)}
            </span>
          </div>

          <div className="flex justify-between text-sm md:text-base">
            <span className="text-slate-700">
              Planned spending (from tools above)
            </span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(plannedSpending || 0)}
            </span>
          </div>

          <div className="flex justify-between text-sm md:text-base">
            <span className="text-slate-700">
              Savings / extra debt payment
            </span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(savings || 0)}
            </span>
          </div>

          <div className="flex justify-between text-sm md:text-base border-t border-slate-200 pt-3 mt-1">
            <span className="text-slate-700">
              Cash left after everything
            </span>
            <span
              className={
                "font-semibold " +
                (cashLeftAfterEverything >= 0
                  ? "text-emerald-600"
                  : "text-red-500")
              }
            >
              {formatCurrency(cashLeftAfterEverything)}
            </span>
          </div>
        </div>

        {/* Rates + legend */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
          <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200">
            <div className="flex justify-between text-sm md:text-base mb-1.5">
              <span className="text-slate-700 font-medium">
                Savings rate
              </span>
              <span className="font-semibold text-emerald-600">
                {savingsRate.toFixed(0)}% of income
              </span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-slate-700 font-medium">
                Spending rate
              </span>
              <span className="font-semibold text-slate-900">
                {spendingRate.toFixed(0)}% of income
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600 mt-3">
              Aim for a plan where your spending and savings fit comfortably
              inside your income, and your leftover cash isn&apos;t negative.
            </p>
          </div>

          <div className="flex flex-col justify-center md:items-end text-xs md:text-sm text-slate-700 gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-slate-900" />
              <span>Planned spending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
              <span>Savings / extra debt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-sky-500" />
              <span>Leftover cash</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
