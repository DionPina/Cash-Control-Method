import { endOfMonth, startOfMonth } from "./dates.ts";
import { currentFinancialPosition } from "./engine.ts";
import { generatePeriodReport } from "./reports.ts";
import type { AccountingData, ExpenseCategory, MonthlyPlan, PeriodReport } from "./types.ts";

export const EMPTY_MONTHLY_PLAN = (month: string): MonthlyPlan => ({
  month,
  expectedIncome: 0,
  categoryBudgets: {},
  plannedDebtPayment: 0,
  plannedSavings: 0,
  safetyBuffer: 0,
});

export function planForMonth(data: AccountingData, month: string): MonthlyPlan {
  return data.monthlyPlans?.find((plan) => plan.month === month) ?? EMPTY_MONTHLY_PLAN(month);
}

export function totalCategoryBudget(plan: MonthlyPlan): number {
  return Object.values(plan.categoryBudgets).reduce((sum, value) => sum + (value ?? 0), 0);
}

export type BudgetVariance = {
  category: ExpenseCategory;
  planned: number;
  actual: number;
  remaining: number;
};

export function budgetVariances(plan: MonthlyPlan, report: PeriodReport): BudgetVariance[] {
  const categories = new Set<ExpenseCategory>([
    ...(Object.keys(plan.categoryBudgets) as ExpenseCategory[]),
    ...report.expenseBreakdown.map((item) => item.category),
  ]);
  return [...categories]
    .map((category) => {
      const planned = plan.categoryBudgets[category] ?? 0;
      const actual = report.expenseBreakdown.find((item) => item.category === category)?.amount ?? 0;
      return { category, planned, actual, remaining: planned - actual };
    })
    .filter((item) => item.planned > 0 || item.actual > 0)
    .sort((a, b) => b.planned - a.planned || b.actual - a.actual);
}

export type PlanProgress = {
  totalCash: number;
  expectedIncomeRemaining: number;
  plannedExpensesRemaining: number;
  uncoveredRequiredPayments: number;
  debtPaymentRemaining: number;
  savingsTarget: number;
  savingsContributed: number;
  savingsRemaining: number;
  safetyBuffer: number;
  availableAfterPlan: number;
  totalPlanned: number;
};

/** One shared calculation for current-month plan progress. */
export function calculatePlanProgress(
  data: AccountingData,
  today: string,
  planOverride?: MonthlyPlan,
): PlanProgress {
  const plan = planOverride ?? planForMonth(data, today.slice(0, 7));
  const periodToDate = generatePeriodReport(data, startOfMonth(today), today);
  const position = currentFinancialPosition(data, today);
  const variances = budgetVariances(plan, periodToDate);
  const plannedExpensesRemaining = variances.reduce(
    (sum, item) => sum + Math.max(0, item.remaining),
    0,
  );
  const requiredByCategory = monthlyObligationsByCategory(data);
  const uncoveredRequiredPayments = [...requiredByCategory.entries()].reduce(
    (sum, [category, required]) => {
      const actual = periodToDate.expenseBreakdown.find((item) => item.category === category)?.amount ?? 0;
      const requiredRemaining = Math.max(0, required - actual);
      const budgetRemaining = Math.max(0, (plan.categoryBudgets[category] ?? 0) - actual);
      return sum + Math.max(0, requiredRemaining - budgetRemaining);
    },
    0,
  );
  const expectedIncomeRemaining = Math.max(0, plan.expectedIncome - periodToDate.incomeFunding);
  const debtPaymentRemaining = Math.max(0, plan.plannedDebtPayment - periodToDate.debtPayments);
  const goalContributionTarget = (data.goals ?? []).reduce(
    (sum, goal) => sum + goal.monthlyContribution,
    0,
  );
  const savingsTarget = Math.max(plan.plannedSavings, goalContributionTarget);
  const savingsContributed = netSavingsTransfers(data, startOfMonth(today), today);
  const savingsRemaining = Math.max(0, savingsTarget - savingsContributed);
  const availableAfterPlan =
    position.totalCash + expectedIncomeRemaining - plannedExpensesRemaining -
    uncoveredRequiredPayments - debtPaymentRemaining - savingsRemaining - plan.safetyBuffer;

  return {
    totalCash: position.totalCash,
    expectedIncomeRemaining,
    plannedExpensesRemaining,
    uncoveredRequiredPayments,
    debtPaymentRemaining,
    savingsTarget,
    savingsContributed,
    savingsRemaining,
    safetyBuffer: plan.safetyBuffer,
    availableAfterPlan,
    totalPlanned: totalCategoryBudget(plan) + uncoveredRequiredPayments +
      plan.plannedDebtPayment + savingsTarget + plan.safetyBuffer,
  };
}

export type SafeToSpendSnapshot = {
  cashNow: number;
  horizonDate: string;
  usesNextIncomeDate: boolean;
  upcomingRequiredPayments: number;
  pendingCashOutflows: number;
  savingsRemaining: number;
  safetyBuffer: number;
  safeToSpend: number;
};

/** A near-term guardrail using known bills, pending cash activity, savings, and buffer. */
export function calculateSafeToSpend(
  data: AccountingData,
  today: string,
  planOverride?: MonthlyPlan,
): SafeToSpendSnapshot {
  const plan = planOverride ?? planForMonth(data, today.slice(0, 7));
  const progress = calculatePlanProgress(data, today, plan);
  const nextIncomeDate = data.profile?.nextIncomeDate;
  const usesNextIncomeDate = Boolean(nextIncomeDate && nextIncomeDate > today);
  const horizonDate = usesNextIncomeDate ? nextIncomeDate! : endOfMonth(today);
  const upcomingRequiredPayments = obligationsDueThrough(data, today, horizonDate);
  const pendingCashOutflows = data.transactions.reduce((sum, transaction) => {
    if (transaction.status !== "pending" || transaction.date < today || transaction.date > horizonDate) return sum;
    if (transaction.type === "expense" && transaction.paymentAccountType === "asset") return sum + transaction.amount;
    if (transaction.type === "debt-payment") return sum + transaction.amount;
    return sum;
  }, 0);

  return {
    cashNow: progress.totalCash,
    horizonDate,
    usesNextIncomeDate,
    upcomingRequiredPayments,
    pendingCashOutflows,
    savingsRemaining: progress.savingsRemaining,
    safetyBuffer: plan.safetyBuffer,
    safeToSpend: progress.totalCash - upcomingRequiredPayments - pendingCashOutflows -
      progress.savingsRemaining - plan.safetyBuffer,
  };
}

export function planPeriod(month: string): { startDate: string; endDate: string } {
  return { startDate: startOfMonth(`${month}-01`), endDate: endOfMonth(`${month}-01`) };
}

function monthlyObligationsByCategory(data: AccountingData): Map<ExpenseCategory, number> {
  const totals = new Map<ExpenseCategory, number>();
  for (const obligation of data.obligations ?? []) {
    totals.set(obligation.category, (totals.get(obligation.category) ?? 0) + obligation.amount);
  }
  return totals;
}

function netSavingsTransfers(data: AccountingData, startDate: string, endDate: string): number {
  const savingsIds = new Set(
    data.assetAccounts.filter((account) => account.type === "savings").map((account) => account.id),
  );
  return Math.max(0, data.transactions.reduce((sum, transaction) => {
    if (transaction.status !== "posted" || transaction.type !== "transfer" ||
      transaction.date < startDate || transaction.date > endDate) return sum;
    if (savingsIds.has(transaction.destinationAssetAccountId)) sum += transaction.amount;
    if (savingsIds.has(transaction.sourceAssetAccountId)) sum -= transaction.amount;
    return sum;
  }, 0));
}

function obligationsDueThrough(data: AccountingData, today: string, horizonDate: string): number {
  let total = 0;
  for (const obligation of data.obligations ?? []) {
    total += recurringAmountDue(obligation.amount, obligation.dueDay, today, horizonDate);
  }
  for (const liability of data.liabilityAccounts) {
    if (liability.minimumPayment && liability.dueDay) {
      total += recurringAmountDue(liability.minimumPayment, liability.dueDay, today, horizonDate);
    }
  }
  return total;
}

function recurringAmountDue(amount: number, dueDay: number, startDate: string, endDate: string): number {
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [endYear, endMonth] = endDate.split("-").map(Number);
  let year = startYear;
  let month = startMonth;
  let total = 0;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const lastDay = new Date(year, month, 0).getDate();
    const date = `${year}-${String(month).padStart(2, "0")}-${String(Math.min(dueDay, lastDay)).padStart(2, "0")}`;
    if (date >= startDate && date <= endDate) total += amount;
    month += 1;
    if (month === 13) { month = 1; year += 1; }
  }
  return total;
}
