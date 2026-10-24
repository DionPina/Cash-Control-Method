"use client";

import { useMemo, useState } from "react";

import { EXPENSE_CATEGORIES, TRANSACTION_TYPE_LABELS, getLabel } from "@/lib/accounting/constants";
import { addDays, formatDate, formatMonth, shiftMonth, startOfWeek, todayIso } from "@/lib/accounting/dates";
import { accountNameForTransaction } from "@/lib/accounting/engine";
import { formatCurrency, formatSignedCurrency } from "@/lib/accounting/format";
import { budgetVariances, planForMonth } from "@/lib/accounting/planning";
import { generateMonthlyReport, generateWeeklyReport, groupIncomeAndFunding } from "@/lib/accounting/reports";
import type { AccountingData, ExpenseBreakdownItem, PeriodReport } from "@/lib/accounting/types";

import { EmptyState, SecondaryButton, SectionCard, SectionHeading, TextInput } from "./ui";

type ReportView = "weekly" | "monthly";

export default function ReportsPanel({ data }: { data: AccountingData }) {
  const today = todayIso();
  const [view, setView] = useState<ReportView>("weekly");
  const [weekDate, setWeekDate] = useState(today);
  const [monthDate, setMonthDate] = useState(today.slice(0, 7));
  const weekly = useMemo(() => generateWeeklyReport(data, weekDate), [data, weekDate]);
  const monthly = useMemo(() => generateMonthlyReport(data, `${monthDate}-01`), [data, monthDate]);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Reviews" title="Turn your records into better decisions" description="Weekly check-ins stay short and practical. Monthly reviews explain the full story behind your cash, spending, plan, and debt." />
      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1" role="tablist" aria-label="Review period">
        {(["weekly", "monthly"] as ReportView[]).map((option) => <button key={option} type="button" role="tab" aria-selected={view === option} onClick={() => setView(option)} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${view === option ? "bg-[#020b24] text-white" : "text-slate-600 hover:text-[#020b24]"}`}>{option === "weekly" ? "Weekly check-in" : "Monthly review"}</button>)}
      </div>
      {view === "weekly" ? <WeeklyReview data={data} report={weekly} weekDate={weekDate} onDate={setWeekDate} /> : <MonthlyReview data={data} report={monthly} month={monthDate} onMonth={setMonthDate} />}
    </div>
  );
}

function WeeklyReview({ data, report, weekDate, onDate }: { data: AccountingData; report: PeriodReport; weekDate: string; onDate: (value: string) => void }) {
  const start = startOfWeek(weekDate);
  const pending = data.transactions.filter((item) => item.status === "pending" && item.date >= report.startDate && item.date <= report.endDate).length;
  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(report.startDate, index);
    const amount = report.transactions.reduce((sum, transaction) => sum + (transaction.type === "expense" && transaction.date === date ? transaction.amount : transaction.type === "debt-payment" && transaction.date === date ? transaction.interestAmount : 0), 0);
    return { date, amount };
  });
  const maxDaily = Math.max(1, ...daily.map((item) => item.amount));
  const largest = report.expenseBreakdown[0];
  const summary = report.transactions.length === 0
    ? "There is no posted activity for this week yet."
    : `You received ${formatCurrency(report.incomeFunding)} and spent ${formatCurrency(report.totalExpensesIncurred)} this week${largest ? `. ${getLabel(EXPENSE_CATEGORIES, largest.category)} was the largest spending area` : ""}.`;

  return <div className="space-y-6">
    <PeriodNavigator title={`${formatDate(report.startDate)} – ${formatDate(report.endDate)}`} input={<TextInput aria-label="Choose a week" type="date" value={weekDate} onChange={(event) => onDate(event.target.value)} />} onPrevious={() => onDate(addDays(start, -7))} onNext={() => onDate(addDays(start, 7))} />
    <section className="rounded-[2rem] bg-[#020b24] p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">This week in one sentence</p><h3 className="mt-3 max-w-3xl text-2xl font-semibold leading-snug sm:text-3xl">{summary}</h3></section>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Cash at week end" value={report.endingPosition.totalCash} /><Metric label="Money received" value={report.incomeFunding} /><Metric label="Money spent" value={report.totalExpensesIncurred} /><Metric label="Upcoming review items" value={report.uncategorizedCount + pending} count /></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard><SectionHeading eyebrow="Where it went" title="Spending by category" /> <CategoryBars breakdown={report.expenseBreakdown.slice(0, 5)} /></SectionCard>
      <SectionCard><SectionHeading eyebrow="Daily view" title="When spending happened" /><div className="mt-6 flex h-48 items-end gap-2">{daily.map((item) => <div key={item.date} className="flex flex-1 flex-col items-center justify-end gap-2"><span className="text-[0.65rem] font-medium text-slate-500">{item.amount > 0 ? formatCurrency(item.amount).replace(".00", "") : ""}</span><div className="w-full rounded-t-lg bg-sky-500" style={{ height: `${Math.max(item.amount > 0 ? 8 : 2, (item.amount / maxDaily) * 120)}px` }} /><span className="text-xs text-slate-500">{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</span></div>)}</div></SectionCard>
    </div>
    <SectionCard><SectionHeading eyebrow="Before you finish" title="Check that everything looks right" /><div className="mt-5 grid gap-3 sm:grid-cols-3"><ReviewItem label="Pending this week" value={pending} /><ReviewItem label="Needs a category" value={report.uncategorizedCount} /><ReviewItem label="Posted entries" value={report.transactions.length} /></div><div className="mt-5 rounded-2xl bg-sky-50 p-4 text-sm text-slate-700">{report.uncategorizedCount + pending > 0 ? "Review these items before relying on the final weekly totals." : "Everything recorded for this week is categorized and posted."}</div></SectionCard>
    <ActivityDetails data={data} report={report} />
  </div>;
}

function MonthlyReview({ data, report, month, onMonth }: { data: AccountingData; report: PeriodReport; month: string; onMonth: (value: string) => void }) {
  const plan = planForMonth(data, month);
  const variances = budgetVariances(plan, report);
  const groups = groupIncomeAndFunding(report);
  const largest = report.expenseBreakdown[0];
  const story = `You received ${formatCurrency(report.incomeFunding)} and had ${formatCurrency(report.totalExpensesIncurred)} in expenses. Cash ${report.netCashChange >= 0 ? "increased" : "decreased"} by ${formatCurrency(Math.abs(report.netCashChange))}${largest ? `, and ${getLabel(EXPENSE_CATEGORIES, largest.category)} was the largest spending area` : ""}.`;

  return <div className="space-y-6">
    <PeriodNavigator title={formatMonth(`${month}-01`)} input={<TextInput aria-label="Choose a month" type="month" value={month} onChange={(event) => onMonth(event.target.value)} />} onPrevious={() => onMonth(shiftMonth(`${month}-01`, -1).slice(0, 7))} onNext={() => onMonth(shiftMonth(`${month}-01`, 1).slice(0, 7))} />
    <section className="rounded-[2rem] bg-[#020b24] p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Your month in one sentence</p><h3 className="mt-3 max-w-4xl text-2xl font-semibold leading-snug sm:text-3xl">{story}</h3></section>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Ending cash" value={report.endingPosition.totalCash} /><Metric label="Total expenses" value={report.totalExpensesIncurred} /><Metric label="Ending debt" value={report.endingPosition.totalLiabilities} /><Metric label="Cash minus debt" value={report.endingPosition.netFinancialPosition} /></div>

    <SectionCard><SectionHeading eyebrow="Cash movement" title="How cash changed" description="Transfers between your own accounts are left out because they do not change total cash." /><div className="mt-6 grid gap-3 md:grid-cols-5"><FlowStep label="Starting cash" value={report.beginningPosition.totalCash} /><FlowStep label="Money received" value={report.incomeFunding + report.borrowedFunds} plus /><FlowStep label="Cash expenses" value={report.cashExpensesPaid} minus /><FlowStep label="Debt payments" value={report.debtPayments} minus /><FlowStep label="Ending cash" value={report.endingPosition.totalCash} /></div></SectionCard>

    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard><SectionHeading eyebrow="Spending" title="Where money went" description="Credit-card purchases count when the purchase happens, not again when the card is paid." /><CategoryBars breakdown={report.expenseBreakdown} /></SectionCard>
      <SectionCard><SectionHeading eyebrow="Money received" title="Where it came from" description="Borrowed money is shown separately from income." /><dl className="mt-5 space-y-2"><MoneyRow label="Work and earned income" value={groups.earnedIncome} /><MoneyRow label="Scholarships and grants" value={groups.scholarshipsGrants} /><MoneyRow label="Family support and gifts" value={groups.familyGifts} /><MoneyRow label="Refunds and other" value={groups.refundsOther} /><MoneyRow label="Borrowed money" value={groups.borrowedFunding} /></dl></SectionCard>
    </div>

    <SectionCard><SectionHeading eyebrow="Plan versus actual" title="How your plan compared with real life" description="The difference helps you adjust the next plan; it is not a score." />{variances.length === 0 ? <div className="mt-5"><EmptyState title="No plan to compare" description="Create a monthly plan to see category-by-category differences here." /></div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-[#decfb0] text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3">Category</th><th className="pb-3 text-right">Planned</th><th className="pb-3 text-right">Actual</th><th className="pb-3 text-right">Difference</th></tr></thead><tbody>{variances.map((item) => <tr key={item.category} className="border-b border-[#eadfc9] last:border-0"><td className="py-3 font-medium text-[#020b24]">{getLabel(EXPENSE_CATEGORIES, item.category)}</td><td className="py-3 text-right">{formatCurrency(item.planned)}</td><td className="py-3 text-right">{formatCurrency(item.actual)}</td><td className={`py-3 text-right font-semibold ${item.remaining < 0 ? "text-amber-800" : "text-slate-700"}`}>{item.remaining >= 0 ? `${formatCurrency(item.remaining)} remaining` : `${formatCurrency(Math.abs(item.remaining))} more`}</td></tr>)}</tbody></table></div>}</SectionCard>

    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard><SectionHeading eyebrow="Debt" title="How money owed changed" /><dl className="mt-5 space-y-2"><MoneyRow label="Starting debt" value={report.beginningPosition.totalLiabilities} /><MoneyRow label="New borrowing" value={report.liabilityBorrowing} /><MoneyRow label="New credit purchases" value={report.liabilityPurchases} /><MoneyRow label="Principal paid" value={report.debtPrincipalPaid} /><MoneyRow label="Cost of borrowing (interest)" value={report.interestExpensePaid} /><MoneyRow label="Ending debt" value={report.endingPosition.totalLiabilities} /></dl></SectionCard>
      <SectionCard><SectionHeading eyebrow="What the records show" title="Carry this into next month" /><ul className="mt-5 space-y-2">{report.observations.slice(0, 4).map((item) => <li key={item} className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700">{item}</li>)}</ul></SectionCard>
    </div>
    <ActivityDetails data={data} report={report} />
  </div>;
}

function PeriodNavigator({ title, input, onPrevious, onNext }: { title: string; input: React.ReactNode; onPrevious: () => void; onNext: () => void }) { return <SectionCard className="!p-4"><div className="flex flex-col items-center justify-between gap-3 sm:flex-row"><SecondaryButton type="button" onClick={onPrevious}>← Previous</SecondaryButton><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c7853]">Selected period</p><p className="mt-1 font-semibold text-[#020b24]">{title}</p></div><SecondaryButton type="button" onClick={onNext}>Next →</SecondaryButton></div><div className="mx-auto mt-3 max-w-xs">{input}</div></SectionCard>; }
function Metric({ label, value, count = false }: { label: string; value: number; count?: boolean }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-[#020b24]">{count ? value : formatCurrency(value)}</p></div>; }
function ReviewItem({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-[#020b24]">{value}</p></div>; }
function FlowStep({ label, value, plus = false, minus = false }: { label: string; value: number; plus?: boolean; minus?: boolean }) { return <div className="rounded-2xl bg-white p-4"><p className="text-xs text-slate-500">{plus ? "+ " : minus ? "− " : ""}{label}</p><p className="mt-1 font-semibold text-[#020b24]">{formatCurrency(value)}</p></div>; }
function MoneyRow({ label, value }: { label: string; value: number }) { return <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 text-sm"><dt className="text-slate-600">{label}</dt><dd className="font-semibold text-[#020b24]">{formatCurrency(value)}</dd></div>; }

function CategoryBars({ breakdown }: { breakdown: ExpenseBreakdownItem[] }) {
  if (!breakdown.length) return <div className="mt-5"><EmptyState title="No posted spending" description="Spending will appear after transactions are recorded and posted." /></div>;
  return <div className="mt-5 space-y-3">{breakdown.map((item) => <div key={item.category}><div className="flex items-center justify-between gap-4 text-sm"><span className="text-slate-600">{getLabel(EXPENSE_CATEGORIES, item.category)}</span><span className="font-semibold text-[#020b24]">{formatCurrency(item.amount)} · {item.percentage.toFixed(0)}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.max(3, item.percentage)}%` }} /></div></div>)}</div>;
}

function ActivityDetails({ data, report }: { data: AccountingData; report: PeriodReport }) {
  return <details className="rounded-3xl border border-[#decfb0] bg-[#fdfaf4] p-5 shadow-sm md:p-7"><summary className="cursor-pointer font-semibold text-[#020b24]">See the {report.transactions.length} posted transaction{report.transactions.length === 1 ? "" : "s"} behind this review</summary>{report.transactions.length === 0 ? <p className="mt-4 text-sm text-slate-600">No posted activity in this period.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-[#decfb0] text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3">Date</th><th className="pb-3">Description</th><th className="pb-3">Type</th><th className="pb-3">Account</th><th className="pb-3 text-right">Amount</th></tr></thead><tbody>{report.transactions.map((transaction) => <tr key={transaction.id} className="border-b border-[#eadfc9] last:border-0"><td className="py-3">{formatDate(transaction.date)}</td><td className="py-3 font-medium">{transaction.description}</td><td className="py-3 text-slate-600">{TRANSACTION_TYPE_LABELS[transaction.type]}</td><td className="py-3 text-slate-600">{accountNameForTransaction(transaction, data)}</td><td className="py-3 text-right font-semibold">{formatCurrency(transaction.amount)}</td></tr>)}</tbody></table></div>}<p className="mt-4 text-xs text-slate-500">Net cash change: {formatSignedCurrency(report.netCashChange)}. Pending activity is not included.</p></details>;
}
