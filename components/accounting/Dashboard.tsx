"use client";

import { EXPENSE_CATEGORIES, getLabel } from "@/lib/accounting/constants";
import { formatDate, todayIso } from "@/lib/accounting/dates";
import { currentFinancialPosition, sortTransactionsNewestFirst } from "@/lib/accounting/engine";
import { formatCurrency } from "@/lib/accounting/format";
import { budgetAmountForWeek, budgetVariances, calculatePlanProgress, calculateSafeToSpend, planForMonth } from "@/lib/accounting/planning";
import { generateMonthlyReport, generatePeriodReport, generateWeeklyReport } from "@/lib/accounting/reports";
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
  const daily = generatePeriodReport(data, today, today);
  const monthly = generateMonthlyReport(data, today);
  const plan = planForMonth(data, month);
  const progress = calculatePlanProgress(data, today);
  const safe = calculateSafeToSpend(data, today);
  const variances = budgetVariances(plan, monthly);
  const pending = data.transactions.filter((transaction) => transaction.status === "pending");
  const uncategorized = data.transactions.filter((transaction) => transaction.status === "posted" && transaction.type === "expense" && transaction.category === "uncategorized");
  const recent = sortTransactionsNewestFirst(data.transactions).slice(0, 4);
  const hasPlan = safe.isCalculated;
  const name = data.profile?.firstName ? `, ${data.profile.firstName}` : "";
  const topWeekly = weekly.expenseBreakdown.slice(0, 4);
  const groceriesThisWeek = weekly.expenseBreakdown.find((item) => item.category === "groceries")?.amount ?? 0;
  const diningThisWeek = weekly.expenseBreakdown.find((item) => item.category === "dining-out")?.amount ?? 0;
  const groceryPlan = budgetAmountForWeek(plan.categoryBudgets.groceries ?? 0, plan.categoryBudgetCadences?.groceries);
  const diningPlan = budgetAmountForWeek(plan.categoryBudgets["dining-out"] ?? 0, plan.categoryBudgetCadences?.["dining-out"]);
  const upcoming = upcomingObligations(data, today).slice(0, 4);
  const insight = buildInsight({ available: progress.availableAfterPlan, pending: pending.length, uncategorized: uncategorized.length, topCategory: topWeekly[0]?.category, topAmount: topWeekly[0]?.amount, hasPlan });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Today" title={`Here’s what matters now${name}`} description="A short view of today, this week, and the money that must last until your next income." action={<PrimaryButton type="button" onClick={() => onNavigate("record")}>Record what happened</PrimaryButton>} />

      <section className="overflow-hidden rounded-[2rem] bg-[#020b24] p-6 text-white shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">{safe.isCalculated ? `Safe to spend through ${formatDate(safe.horizonDate)}` : "Cash available today"}</p>
            {safe.isCalculated ? (
              <p className={`mt-3 text-4xl font-semibold tracking-tight sm:text-5xl ${safe.safeToSpend < 0 ? "text-amber-300" : "text-white"}`}>{formatCurrency(safe.safeToSpend)}</p>
            ) : (
              <div className="mt-3"><p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{formatCurrency(safe.cashNow)}</p><p className="mt-2 text-lg font-semibold text-amber-300">Safe to spend: Not yet calculated</p></div>
            )}
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{safe.isCalculated ? <>This guardrail starts with cash today and protects bills you added, pending cash activity, unfinished savings, and your cash cushion. {safe.usesNextIncomeDate ? "It stops at your next expected income date." : "Add a future income date to use a before-payday horizon."}</> : "Cash on hand is not automatically safe to spend. Add expected income, bills, everyday needs, savings, and a cushion before relying on this guardrail."}</p>
            <button type="button" onClick={() => onNavigate("plan")} className="mt-4 text-sm font-semibold text-sky-300 underline decoration-sky-500 underline-offset-4">{safe.isCalculated ? "See how this was calculated" : "Build the plan to calculate it"}</button>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <DarkMetric label="Cash today" value={safe.cashNow} />
            <DarkMetric label="Bills + planned needs" value={safe.upcomingRequiredPayments + safe.plannedNeedsRemaining} />
            <DarkMetric label="Pending cash out" value={safe.pendingCashOutflows} />
            <DarkMetric label="Savings + cushion" value={safe.savingsRemaining + safe.safetyBuffer} />
          </dl>
        </div>
      </section>

      {!hasPlan && (
        <SectionCard className="border-sky-200 bg-sky-50">
          <SectionHeading eyebrow="Finish setup" title="Turn cash on hand into a useful spending guardrail" description="Your opening balances are saved. Complete the remaining foundations so Cash Control can calculate what is genuinely available." action={<PrimaryButton type="button" onClick={() => onNavigate("plan")}>Build my plan</PrimaryButton>} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SetupItem label="Cash balances" complete={data.assetAccounts.length > 0} />
            <SetupItem label="Expected income" complete={plan.expectedIncome > 0 || Boolean(data.profile?.nextIncomeAmount)} />
            <SetupItem label="Bills and needs" complete={(data.obligations?.length ?? 0) > 0 || Object.values(plan.categoryBudgets).some((value) => (value ?? 0) > 0)} />
            <SetupItem label="Savings or cushion" complete={plan.plannedSavings > 0 || plan.safetyBuffer > 0 || (data.goals?.length ?? 0) > 0} />
          </div>
        </SectionCard>
      )}

      <SectionCard>
        <SectionHeading eyebrow="Accounting foundations" title="Your full financial position" description="Cash, funding, expenses, and debts stay connected to the same transaction ledger." action={<SecondaryButton type="button" onClick={() => onNavigate("accounts")}>Manage accounts</SecondaryButton>} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FoundationCard label="Cash & assets" value={position.totalCash + (position.totalRestricted ?? 0)} detail={`${formatCurrency(position.totalCash)} spendable cash${(position.totalRestricted ?? 0) > 0 ? ` + ${formatCurrency(position.totalRestricted ?? 0)} restricted` : ""}`} />
          <FoundationCard label="Income & funding" value={monthly.incomeFunding + monthly.borrowedFunds} detail={`${formatCurrency(monthly.incomeFunding)} income · ${formatCurrency(monthly.borrowedFunds)} borrowed`} />
          <FoundationCard label="Expenses" value={monthly.totalExpensesIncurred} detail="Incurred this month, regardless of payment method" />
          <FoundationCard label="Liabilities" value={position.totalLiabilities} detail={`${position.liabilityBalances.length} account${position.liabilityBalances.length === 1 ? "" : "s"} owed`} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <PositionList title="What you own" empty="No asset accounts added" items={[...position.assetBalances, ...(position.restrictedBalances ?? [])]} />
          <PositionList title="What you owe" empty="No liabilities recorded" items={position.liabilityBalances} />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#020b24] px-4 py-3 text-white"><span className="text-sm text-slate-300">Net financial position</span><strong>{formatCurrency(position.netFinancialPosition)}</strong></div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LightMetric label="Spent today" value={daily.totalExpensesIncurred} />
        <LightMetric label="Cash used today" value={daily.cashExpensesPaid + daily.debtPayments + daily.mealPlanFundingCash} />
        <LightMetric label="Money received today" value={daily.incomeFunding} />
        <LightMetric label="Meal-plan value" value={position.totalRestricted ?? 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <WeeklyPace label="Groceries this week" actual={groceriesThisWeek} planned={groceryPlan} />
        <WeeklyPace label="Dining out this week" actual={diningThisWeek} planned={diningPlan} />
      </div>

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
function FoundationCard({ label, value, detail }: { label: string; value: number; detail: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{label}</p><p className="mt-2 text-2xl font-semibold text-[#020b24]">{formatCurrency(value)}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>; }
function PositionList({ title, empty, items }: { title: string; empty: string; items: Array<{ id: string; name: string; balance: number }> }) { return <div className="rounded-2xl bg-white p-4"><h3 className="text-sm font-semibold text-[#020b24]">{title}</h3>{items.length === 0 ? <p className="mt-3 text-sm text-slate-500">{empty}</p> : <dl className="mt-3 space-y-2">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 text-sm"><dt className="text-slate-600">{item.name}</dt><dd className="font-semibold text-[#020b24]">{formatCurrency(item.balance)}</dd></div>)}</dl>}</div>; }
function SetupItem({ label, complete }: { label: string; complete: boolean }) { return <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm"><span aria-hidden="true" className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{complete ? "✓" : "·"}</span><span className="font-medium text-[#020b24]">{label}</span></div>; }
function WeeklyPace({ label, actual, planned }: { label: string; actual: number; planned: number }) { const remaining = planned - actual; const width = planned > 0 ? Math.min(100, (actual / planned) * 100) : 0; return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-[#020b24]">{label}</p><p className="mt-1 text-xs text-slate-500">{planned > 0 ? remaining >= 0 ? `${formatCurrency(remaining)} left from ${formatCurrency(planned)}` : `${formatCurrency(Math.abs(remaining))} over the weekly plan` : "Add a weekly amount in Plan"}</p></div><p className="font-semibold text-[#020b24]">{formatCurrency(actual)}</p></div>{planned > 0 && <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${remaining < 0 ? "bg-amber-500" : "bg-sky-600"}`} style={{ width: `${width}%` }} /></div>}</div>; }
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
