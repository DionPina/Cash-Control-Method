"use client";

import React, { useEffect, useState } from "react";

export type WeeklyCashPlanTotals = {
  income: number;
  fixed: number;
  variable: number;
  savings: number;
  totalExpenses: number;
  cashLeftAfterExpenses: number;
};

type WeeklyCashPlanProps = {
  onTotalsChange?: (totals: WeeklyCashPlanTotals) => void;
};

function parseNumber(value: string): number {
  if (!value) return 0;
  // Remove commas, dollar signs, spaces, etc.
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function WeeklyCashPlan({ onTotalsChange }: WeeklyCashPlanProps) {
  // Raw text values from the inputs
  const [income, setIncome] = useState("");
  const [fixed, setFixed] = useState("");
  const [variable, setVariable] = useState("");
  const [savings, setSavings] = useState("");

  // Numeric versions used for calculations
  const incomeValue = parseNumber(income);
  const fixedValue = parseNumber(fixed);
  const variableValue = parseNumber(variable);
  const savingsValue = parseNumber(savings);

  const totalExpenses = fixedValue + variableValue + savingsValue;
  const cashLeftAfterExpenses = incomeValue - totalExpenses;

  // Weekly “cash control” number
  const safePerWeek = cashLeftAfterExpenses / 4;

  useEffect(() => {
    if (!onTotalsChange) return;

    onTotalsChange({
      income: incomeValue,
      fixed: fixedValue,
      variable: variableValue,
      savings: savingsValue,
      totalExpenses,
      cashLeftAfterExpenses,
    });
  }, [
    incomeValue,
    fixedValue,
    variableValue,
    savingsValue,
    totalExpenses,
    cashLeftAfterExpenses,
    onTotalsChange,
  ]);

  const savingsRate =
    incomeValue > 0 ? (savingsValue / incomeValue) * 100 : 0;

  return (
    <section
      id="weekly-cash-plan"
      className="mt-10 w-full px-3 pb-12 pt-8 md:px-6 lg:px-8 scroll-mt-24"
    >
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/90 shadow-sm px-4 py-8 md:px-8 md:py-10">
        {/* Heading + description */}
        <div className="max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Step 1
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
            Weekly Cash Plan
          </h2>
          <p className="mt-3 text-sm md:text-base text-slate-700 leading-relaxed">
            Enter your monthly numbers to see how much cash you have left after
            essentials, and how much is safe to spend per week. This is the
            core of the Cash Control Method.
          </p>
        </div>

        {/* Content grid */}
        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Left column – inputs */}
          <div className="space-y-6">
            {/* Monthly income */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Monthly income (after tax)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 5,000"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Total cash you actually see hit your account each month.
              </p>
            </div>

            {/* Fixed expenses */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Fixed expenses (rent, utilities, phone, etc.)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={fixed}
                onChange={(e) => setFixed(e.target.value)}
                placeholder="e.g. 1,000"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Bills that don&apos;t move much month to month.
              </p>
            </div>

            {/* Variable expenses */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Variable budget (food, gas, fun, etc.)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={variable}
                onChange={(e) => setVariable(e.target.value)}
                placeholder="e.g. 300"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Money you plan to spend on flexible things like groceries, gas,
                and fun.
              </p>
            </div>

            {/* Savings / extra debt payment */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Savings / extra debt payment
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                placeholder="e.g. 200"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                What you&apos;re setting aside on purpose each month.
              </p>
            </div>
          </div>

          {/* Right column – summary */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 md:px-5 md:py-6">
            <h3 className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
              Summary
            </h3>

            <dl className="mt-4 space-y-3 text-sm md:text-base">
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Total monthly expenses</dt>
                <dd className="font-medium text-slate-900">
                  {formatCurrency(totalExpenses)}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Cash left after expenses</dt>
                <dd
                  className={`font-semibold ${
                    cashLeftAfterExpenses < 0
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {formatCurrency(cashLeftAfterExpenses)}
                </dd>
              </div>
              {cashLeftAfterExpenses < 0 && incomeValue > 0 && (
  <p className="mt-2 text-xs text-rose-600 leading-snug">
    Your plan is currently in the red. Try lowering flexible spending or
    savings until this is at least $0 so you&apos;re not relying on debt.
  </p>
)}

{cashLeftAfterExpenses >= 0 && incomeValue > 0 && (
  <p className="mt-2 text-xs text-emerald-700 leading-snug">
    Nice — this plan leaves you with cash after expenses. This is your buffer
    and opportunity money for emergencies or goals.
  </p>
)}

              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Savings rate (monthly)</dt>
                <dd className="font-medium text-slate-900">
                  {savingsRate > 0 ? `${savingsRate.toFixed(1)}%` : "0%"}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 mb-1">
                SAFE TO SPEND PER WEEK
              </p>
              <p className="text-2xl md:text-3xl font-semibold text-slate-900">
                {formatCurrency(Number.isFinite(safePerWeek) ? safePerWeek : 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500 leading-snug">
                This is your weekly “cash control” number — what&apos;s left
                after your plan, divided by 4 weeks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
