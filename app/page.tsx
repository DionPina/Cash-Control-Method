// app/page.tsx
"use client";

import { useState } from "react";

import Hero from "@/components/Hero";
import WeeklyCashPlan from "@/components/WeeklyCashPlan";
import MonthlyCashSnapshot from "@/components/MonthlyCashSnapshot";
import CashControlSummary from "@/components/CashControlSummary";
import ExpenseCategories from "@/components/ExpenseCategories";

type WeeklyTotals = {
  income: number;
  fixed: number;
  variable: number;
  savings: number;
  totalExpenses: number;
  cashLeftAfterExpenses: number;
};

type CategoryTotals = {
  totalCategories: number;
  averagePerWeek: number;
};

export default function HomePage() {
  // Numbers coming from WeeklyCashPlan
  const [weeklyTotals, setWeeklyTotals] = useState<WeeklyTotals>({
    income: 0,
    fixed: 0,
    variable: 0,
    savings: 0,
    totalExpenses: 0,
    cashLeftAfterExpenses: 0,
  });

  // Numbers coming from ExpenseCategories
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotals>({
    totalCategories: 0,
    averagePerWeek: 0,
  });

  // Treat everything in WeeklyCashPlan as MONTHLY
  const monthlyIncome = weeklyTotals.income;
  const monthlyExpenses = weeklyTotals.totalExpenses;
  const monthlySavings = weeklyTotals.savings;
  const monthlyCashLeft = weeklyTotals.cashLeftAfterExpenses;

  // Simple 4-week month view
  const weeklyIncome = monthlyIncome / 4;
  const weeklyExpenses = monthlyExpenses / 4;
  const weeklySavings = monthlySavings / 4;
  const weeklyCashLeft = weeklyIncome - weeklyExpenses;

  // Categories = planned spending pulled in from ExpenseCategories
  const plannedSpending = categoryTotals.totalCategories;

  // Savings rates as decimals (CashControlSummary turns them into xx.x%)
  const weeklySavingsRate =
    weeklyIncome > 0 ? weeklySavings / weeklyIncome : 0;
  const monthlySavingsRate =
    monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0;

  const summaryItems = [
    {
      label: "Weekly Income",
      value: weeklyIncome,
      helper: "Your monthly income divided by 4.",
    },
    {
      label: "Weekly Expenses",
      value: weeklyExpenses,
      helper: "Fixed + variable + savings, divided by 4.",
    },
    {
      label: "Weekly Cash Left",
      value: weeklyCashLeft,
      helper: "If this is positive and realistic, your plan is on track.",
      badge: "Key metric",
    },
    {
      label: "Monthly Income",
      value: monthlyIncome,
      helper: "Pulled directly from your Weekly Cash Plan.",
    },
    {
      label: "Monthly Expenses",
      value: monthlyExpenses,
      helper: "Total fixed + variable + savings for the month.",
    },
    {
      label: "Monthly Cash Left",
      value: monthlyCashLeft,
      helper: "Cash left after everything for the month.",
      badge: "Key metric",
    },
    {
      label: "Savings Rate (weekly)",
      value: weeklySavingsRate,
      helper: "Savings as a share of your weekly income.",
    },
    {
      label: "Savings Rate (monthly)",
      value: monthlySavingsRate,
      helper: "Savings as a share of your monthly income.",
      badge: "Key metric",
    },
  ];

  return (
    <>
      {/* Hero */}
      <Hero />

      {/* Tools area */}
      <div id="tools" className="pb-16 scroll-mt-24">
        {/* Intro text above the tools */}
        <section className="mx-auto max-w-5xl px-4 pt-6 md:pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 text-center">
            How it works
          </p>
          <h2 className="mt-2 text-center text-2xl md:text-3xl font-semibold text-slate-900">
            Three simple steps to control your cash
          </h2>
          <p className="mt-2 max-w-2xl mx-auto text-center text-sm md:text-base text-slate-600">
            Start with your income and bills, zoom out to see your month, then
            check your categories so your plan and your real-life spending line
            up.
          </p>
        </section>

        {/* Weekly Cash Plan drives everything */}
        <WeeklyCashPlan
          onTotalsChange={(totals) => setWeeklyTotals(totals)}
        />

        {/* Monthly snapshot, auto-updating from WeeklyCashPlan + categories */}
        <MonthlyCashSnapshot
          income={monthlyIncome}
          plannedSpending={plannedSpending}
          savings={monthlySavings}
        />

        {/* Summary cards for quick at-a-glance view */}
        <section className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <CashControlSummary items={summaryItems} />
        </section>

        {/* Categories + donut chart (already shows percentages) */}
        <ExpenseCategories
          onTotalsChange={(totals) =>
            setCategoryTotals({
              totalCategories: totals.totalCategories,
              averagePerWeek: totals.averagePerWeek,
            })
          }
        />

        {/* Method section hook (we can expand the content later if you want) */}
        <section
          id="method"
          className="mx-auto max-w-5xl px-4 pb-14 md:pb-16 scroll-mt-24"
        >
          <div className="rounded-3xl bg-white p-6 md:p-10 border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase mb-2">
              The Cash Control Method
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              A structured financial discipline framework
            </h2>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed mb-4">
              Financial control means you decide how your money moves—not
              stress, not impulse, not the economy. Cash Control is a simple,
              structured system designed to teach clarity, stability, and
              confidence with money.
            </p>
            <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-2">
              The core framework
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm md:text-base text-slate-700">
              <li>Pause and get clear on your real starting point.</li>
              <li>Establish weekly cash inflows you can depend on.</li>
              <li>Define obligations: rent, bills, and non-negotiables.</li>
              <li>
                Build controls for flexible costs like food, gas, and fun so
                they don&apos;t run the show.
              </li>
              <li>
                Protect emergency stability with a real buffer, not just vibes.
              </li>
              <li>
                Layer in smart economic decisions (like real-rate thinking) so
                your choices make sense in today&apos;s environment.
              </li>
            </ol>
          </div>
        </section>

        {/* About section */}
        <section id="about" className="mx-auto max-w-5xl px-4 pb-16 scroll-mt-24">
          <div className="rounded-3xl bg-white p-6 md:p-10 border border-slate-200 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              About the Creator
            </h2>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed mb-4">
              Cash Control Method was created by{" "}
              <span className="font-semibold">Dion Pina</span>, an accounting
              student who wanted a simple, no-subscription way for students to
              stay on top of their cash. The system combines real accounting
              logic with simple spreadsheets so you can build strong money
              habits now and carry them into your career.
            </p>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed">
              This is just the first version. Over time, the plan is to add
              downloadable templates, walkthroughs, and simple tools that help
              you apply what you learn in accounting, economics, and personal
              finance—without losing control of your cash.
            </p>
          </div>
        </section>

        {/* Contact / footer placeholder */}
        <section id="contact" className="bg-slate-900 text-slate-100 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm md:text-base">
            <p className="text-slate-300">
              Have ideas for new tools or want to use Cash Control Method with a
              class or club? A simple contact form will live here soon.
            </p>
            <span className="inline-flex items-center rounded-full border border-slate-500 px-4 py-2 text-xs md:text-sm text-slate-200">
              Coming soon · Student tools in progress
            </span>
          </div>
        </section>
      </div>
      <p className="max-w-5xl mx-auto px-4 pb-8 text-center text-[0.7rem] md:text-xs text-slate-500">
  Cash Control Method is an educational tool and does not provide personalized
  financial, investment, or tax advice. Talk to a qualified professional before
  making major financial decisions.
</p>
    </>
  );
}
