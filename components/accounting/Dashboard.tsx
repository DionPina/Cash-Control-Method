"use client";

import { EXPENSE_CATEGORIES, getLabel } from "@/lib/accounting/constants";
import { formatDate, todayIso } from "@/lib/accounting/dates";
import { currentFinancialPosition, sortTransactionsNewestFirst } from "@/lib/accounting/engine";
import { formatCurrency } from "@/lib/accounting/format";
import { budgetVariances, createPlanSnapshot, planForMonth } from "@/lib/accounting/planning";
import { generateMonthlyReport, generateWeeklyReport } from "@/lib/accounting/reports";
import type { AccountingData, ExpenseCategory } from "@/lib/accounting/types";

import { EmptyState, PrimaryButton, SectionCard, SectionHeading, SecondaryButton, StatusPill } from "./ui";

type DashboardProps = {
  data: AccountingData;
  onNavigate: (area: "record" | "accounts" | "activity" | "plan" | "reviews") => void;
};

export default function Dashboard({ data, onNavigate }: DashboardProps) {
  const today = todayIso();
  const month = today.slice(0, 7);
  const position = currentFinancialPosition(data, today);
  const weekly = generateWeeklyReport(data, today);
  const monthly = generateMonthlyReport(data, today);
  const plan = planForMonth(data, month);
  const snapshot = createPlanSnapshot(data, today, monthly);
  const variances = budgetVariances(plan, monthly);
  const pending = data.transactions.filter((transaction) => transaction.status === "pending");
  const uncategorized = data.transactions.filter((transaction) => transaction.status === "posted" && transaction.type === "expense" && transaction.category === "uncategorized");
  const recent = sortTransactionsNewestFirst(data.transactions).slice(0, 4);
  const hasPlan = plan.expectedIncome > 0 || Object.values(plan.categoryBudgets).some((value) => (value ?? 0) > 0);
  const name = data.profile?.firstName ? `, ${data.profile.firstName}` : "";
  const topWeekly = weekly.expenseBreakdown.slice(0, 4);
  const upcoming = upcomingObligations(data, today).slice(0, 4);
  const insight = buildInsight({ available: snapshot.availableToPlan, pending: pending.length, uncategorized: uncategorized.length, topCategory: topWeekly[0]?.category, topAmount: topWeekly[0]?.amount, hasPlan });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Home" title={`Here’s your money picture${name}`} description="Start with what needs your attention now. Open the details only when you need them." action={<PrimaryButton type="button" onClick={() => onNavigate("record")}>Record what happened</PrimaryButton>} />

      <section className="overflow-hidden rounded-[2rem] bg-[#020b24] p-6 text-white shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Available after your plan</p>
            <p className={`mt-3 text-4xl font-semibold tracking-tight sm:text-5xl ${snapshot.availableToPlan < 0 ? "text-amber-300" : "text-white"}`}>{formatCurrency(snapshot.availableToPlan)}</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">This estimate starts with current cash, includes expected money still to come, and sets aside the unfinished parts of your plan and cash cushion.</p>
            <button type="button" onClick={() => onNavigate("plan")} className="mt-4 text-sm font-semibold text-sky-300 underline decoration-sky-500 underline-offset-4">See how this was calculated</button>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <DarkMetric label="Cash today" value={snapshot.totalCash} />
            <DarkMetric label="Expected next" value={snapshot.expectedIncomeRemaining} />
            <DarkMetric label="Expenses left in plan" value={snapshot.plannedExpensesRemaining} />
            <DarkMetric label="Cash cushion" value={snapshot.safetyBuffer} />
          </dl>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard>
          <SectionHeading eyebrow="This week" title="Your weekly check-in" description={`${formatDate(weekly.startDate)} – ${formatDate(weekly.endDate)}`} action={<SecondaryButton type="button" onClick={() => onNavigate("reviews")}>Open weekly review</SecondaryButton>} />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <LightMetric label="Money received" value={weekly.incomeFunding} />
            <LightMetric label="Money spent" value={weekly.totalExpensesIncurred} />
            <LightMetric label="Cash now" value={position.totalCash} />
          </div>
          {topWeekly.length === 0 ? <p className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-600">Recorded spending will appear here by category.</p> : <div className="mt-6 space-y-3">{topWeekly.map((item) => <div key={item.category}><div className="flex justify-between gap-4 text-sm"><span className="text-slate-600">{getLabel(EXPENSE_CATEGORIES, item.category)}</span><span className="font-semibold text-[#020b24]">{formatCurrency(item.amount)}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.max(4, item.percentage)}%` }} /></div></div>)}</div>}
        </SectionCard>

        <SectionCard className="bg-white">
          <SectionHeading eyebrow="Next step" title="What needs attention" />
          <p className="mt-5 rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-slate-700">{insight}</p>
          <div className="mt-4 space-y-2">
            <AttentionRow label="Pending activity" value={pending.length} action={() => onNavigate("activity")} />
            <AttentionRow label="Needs a category" value={uncategorized.length} action={() => onNavigate("activity")} />
            <AttentionRow label="Plan categories over amount" value={variances.filter((item) => item.remaining < 0).length} action={() => onNavigate("plan")} />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <SectionHeading eyebrow="Coming up" title="Bills and required payments" action={<SecondaryButton type="button" onClick={() => onNavigate("plan")}>Manage plan</SecondaryButton>} />
          {upcoming.length === 0 ? <div className="mt-5"><EmptyState title="Nothing added yet" description="Add required payments to keep their amounts and due dates visible." /></div> : <div className="mt-5 space-y-2">{upcoming.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm"><div><p className="font-medium text-[#020b24]">{item.name}</p><p className="text-xs text-slate-500">Due {item.dateLabel}</p></div><span className="font-semibold text-[#020b24]">{formatCurrency(item.amount)}</span></div>)}</div>}
        </SectionCard>

        <SectionCard>
          <SectionHeading eyebrow="Recent activity" title="What you recorded" action={<SecondaryButton type="button" onClick={() => onNavigate("activity")}>See all</SecondaryButton>} />
          {recent.length === 0 ? <div className="mt-5"><EmptyState title="No activity yet" description="Record your first money event and Cash Control will begin building your weekly picture." action={<PrimaryButton type="button" onClick={() => onNavigate("record")}>Record what happened</PrimaryButton>} /></div> : <div className="mt-5 divide-y divide-[#eadfc9]">{recent.map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-medium text-[#020b24]">{transaction.description}</p><div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><span>{formatDate(transaction.date)}</span><StatusPill status={transaction.status} /></div></div><span className="shrink-0 text-sm font-semibold text-[#020b24]">{formatCurrency(transaction.amount)}</span></div>)}</div>}
        </SectionCard>
      </div>
    </div>
  );
}

function DarkMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-white/10 p-3"><dt className="text-xs text-slate-300">{label}</dt><dd className="mt-1 font-semibold text-white">{formatCurrency(value)}</dd></div>; }
function LightMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-[#020b24]">{formatCurrency(value)}</p></div>; }
function AttentionRow({ label, value, action }: { label: string; value: number; action: () => void }) { return <button type="button" onClick={action} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-sky-300"><span className="text-slate-600">{label}</span><span className={`font-semibold ${value > 0 ? "text-amber-800" : "text-[#020b24]"}`}>{value}</span></button>; }

function buildInsight({ available, pending, uncategorized, topCategory, topAmount, hasPlan }: { available: number; pending: number; uncategorized: number; topCategory?: ExpenseCategory; topAmount?: number; hasPlan: boolean }): string {
  if (!hasPlan) return "Build your first monthly plan so Cash Control can show what is available after upcoming needs.";
  if (pending + uncategorized > 0) return `Review ${pending + uncategorized} item${pending + uncategorized === 1 ? "" : "s"} before relying on this week’s totals.`;
  if (available < 0) return "Your current plan assigns more money than is available. Open the plan to adjust the timing or amounts.";
  if (topCategory && topAmount) return `${getLabel(EXPENSE_CATEGORIES, topCategory)} is your largest spending area this week at ${formatCurrency(topAmount)}.`;
  return "Your records are up to date. Keep recording activity so the next weekly check-in stays useful.";
}

function upcomingObligations(data: AccountingData, today: string) {
  const now = new Date(`${today}T12:00:00`);
  return (data.obligations ?? []).map((item) => {
    let due = new Date(now.getFullYear(), now.getMonth(), Math.min(item.dueDay, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()), 12);
    if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(item.dueDay, new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()), 12);
    return { ...item, dueTime: due.getTime(), dateLabel: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
  }).sort((a, b) => a.dueTime - b.dueTime);
}
