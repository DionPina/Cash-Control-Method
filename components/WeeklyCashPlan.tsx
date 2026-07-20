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

const parseCurrency = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
};

const formatCurrency = (value: number): string =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export default function WeeklyCashPlan({ onTotalsChange }: WeeklyCashPlanProps) {
  const [income, setIncome] = useState("");
  const [fixed, setFixed] = useState("");
  const [variable, setVariable] = useState("");
  const [savings, setSavings] = useState("");

  const incomeValue = parseCurrency(income);
  const fixedValue = parseCurrency(fixed);
  const variableValue = parseCurrency(variable);
  const savingsValue = parseCurrency(savings);

  const totalExpenses = fixedValue + variableValue + savingsValue;
  const cashLeftAfterExpenses = incomeValue - totalExpenses;

  const weeklyIncome = incomeValue / 4;
  const weeklyFixed = fixedValue / 4;
  const weeklyVariable = variableValue / 4;
  const weeklySavings = savingsValue / 4;
  const weeklyCashLeft = weeklyIncome - weeklyFixed - weeklyVariable - weeklySavings;

  useEffect(() => {
    onTotalsChange?.({
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

  return (
    <section
  id="weekly-cash-plan"
  className="mt-12 w-full px-3 pb-12 pt-8 md:px-6 lg:px-8 scroll-mt-24"
>
  <div className="mx-auto max-w-5xl rounded-3xl border border-[#decfb0] bg-[#fdfaf4] shadow-sm px-4 py-8 md:px-8 md:py-10">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#8c7853] uppercase">
          Step 1
        </p>
        <h2 className="text-2xl font-semibold md:text-3xl text-[#020b24]">
  Weekly Cash Plan
</h2>
        <p className="mt-2 text-sm md:text-base text-[#6b4a2f] max-w-2xl">
          Enter your monthly numbers to see how much cash you have left after
          essentials, and how much is safe to spend per week. This is the core
          of the Cash Control Method.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          {/* Inputs */}
          <div className="space-y-6">
            {/* Income */}
            <div>
              <label className="block text-xs font-semibold tracking-[0.16em] text-[#8c7853] uppercase">
                Monthly income (after tax)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 5,000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full rounded-xl border border-[#d9cdb7] bg-[#f5f2ea] px-3 py-2.5 text-sm md:text-base text-[#020b24] outline-none focus:border-[#6b4a2f] focus:ring-2 focus:ring-[#ebe0cf]"
              />
              <p className="mt-1 text-xs text-[#8c7853]">
                Total cash you actually see hit your account each month.
              </p>
            </div>

            {/* Fixed */}
            <div>
              <label className="block text-xs font-semibold tracking-[0.16em] text-[#8c7853] uppercase">
                Fixed expenses (rent, utilities, phone, etc.)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1,000"
                value={fixed}
                onChange={(e) => setFixed(e.target.value)}
                className="w-full rounded-xl border border-[#d9cdb7] bg-[#f5f2ea] px-3 py-2.5 text-sm md:text-base text-[#020b24] outline-none focus:border-[#6b4a2f] focus:ring-2 focus:ring-[#ebe0cf]"
              />
              <p className="mt-1 text-xs text-[#8c7853]">
                Bills that don&apos;t move much month to month.
              </p>
            </div>

            {/* Variable */}
            <div>
              <label className="block text-xs font-semibold tracking-[0.16em] text-[#8c7853] uppercase">
                Variable budget (food, gas, fun, etc.)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 300"
                value={variable}
                onChange={(e) => setVariable(e.target.value)}
                className="w-full rounded-xl border border-[#d9cdb7] bg-[#f5f2ea] px-3 py-2.5 text-sm md:text-base text-[#020b24] outline-none focus:border-[#6b4a2f] focus:ring-2 focus:ring-[#ebe0cf]"
              />
              <p className="mt-1 text-xs text-[#8c7853]">
                Money you plan to spend on flexible things like groceries, gas,
                and fun.
              </p>
            </div>

            {/* Savings */}
            <div>
              <label className="block text-xs font-semibold tracking-[0.16em] text-[#8c7853] uppercase">
                Savings / extra debt payment
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 200"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                className="w-full rounded-xl border border-[#d9cdb7] bg-[#f5f2ea] px-3 py-2.5 text-sm md:text-base text-[#020b24] outline-none focus:border-[#6b4a2f] focus:ring-2 focus:ring-[#ebe0cf]"
              />
              <p className="mt-1 text-xs text-[#8c7853]">
                What you&apos;re setting aside on purpose each month.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#decfb0] bg-[#f7f3ea] px-4 py-5 md:px-5 md:py-6">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#8c7853] uppercase">
                Monthly summary
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b4a2f]">Total monthly expenses</span>
                  <span className="font-semibold text-[#020b24]">
                    {formatCurrency(totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b4a2f]">
                    Cash left after expenses
                  </span>
                  <span
                    className={`font-semibold ${
                      cashLeftAfterExpenses >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(cashLeftAfterExpenses)}
                  </span>
                </div>
              </div>

              <hr className="my-4 border-[#e2d3c0]" />

              <p className="text-xs font-semibold tracking-[0.18em] text-[#8c7853] uppercase">
                Weekly view (4-week month)
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b4a2f]">Weekly income</span>
                  <span className="font-medium text-[#020b24]">
                    {formatCurrency(weeklyIncome || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b4a2f]">Weekly expenses</span>
                  <span className="font-medium text-[#020b24]">
                    {formatCurrency(weeklyFixed + weeklyVariable + weeklySavings || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b4a2f]">Weekly cash left</span>
                  <span
                    className={`font-semibold ${
                      weeklyCashLeft >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(weeklyCashLeft || 0)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8c7853]">
              This plan is a starting point. You can tweak your fixed, variable,
              or savings amounts until the weekly cash left feels realistic.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
