import { endOfMonth, startOfMonth } from "./dates.ts";
import { currentFinancialPosition } from "./engine.ts";
import type {
  AccountingData,
  ExpenseCategory,
  MonthlyPlan,
  PeriodReport,
} from "./types.ts";

export const EMPTY_MONTHLY_PLAN = (month: string): MonthlyPlan => ({
  month,
  expectedIncome: 0,
  categoryBudgets: {},
  plannedDebtPayment: 0,
  plannedSavings: 0,
  safetyBuffer: 0,
});

export function planForMonth(data: AccountingData, month: string): MonthlyPlan {
  return (
    data.monthlyPlans?.find((plan) => plan.month === month) ??
    EMPTY_MONTHLY_PLAN(month)
  );
}

export function totalCategoryBudget(plan: MonthlyPlan): number {
  return Object.values(plan.categoryBudgets).reduce(
    (sum, value) => sum + (value ?? 0),
    0,
  );
}

export type BudgetVariance = {
  category: ExpenseCategory;
  planned: number;
  actual: number;
  remaining: number;
};

export function budgetVariances(
  plan: MonthlyPlan,
  report: PeriodReport,
): BudgetVariance[] {
  const categories = new Set<ExpenseCategory>([
    ...(Object.keys(plan.categoryBudgets) as ExpenseCategory[]),
    ...report.expenseBreakdown.map((item) => item.category),
  ]);

  return [...categories]
    .map((category) => {
      const planned = plan.categoryBudgets[category] ?? 0;
      const actual =
        report.expenseBreakdown.find((item) => item.category === category)?.amount ?? 0;
      return { category, planned, actual, remaining: planned - actual };
    })
    .filter((item) => item.planned > 0 || item.actual > 0)
    .sort((a, b) => b.planned - a.planned || b.actual - a.actual);
}

export type PlanSnapshot = {
  totalCash: number;
  expectedIncomeRemaining: number;
  plannedExpensesRemaining: number;
  debtPaymentRemaining: number;
  plannedSavings: number;
  safetyBuffer: number;
  availableToPlan: number;
  totalPlanned: number;
};

export function createPlanSnapshot(
  data: AccountingData,
  today: string,
  monthlyReport: PeriodReport,
): PlanSnapshot {
  const month = today.slice(0, 7);
  const plan = planForMonth(data, month);
  const position = currentFinancialPosition(data, today);
  const totalBudget = totalCategoryBudget(plan);
  const expectedIncomeRemaining = Math.max(
    0,
    plan.expectedIncome - monthlyReport.incomeFunding,
  );
  const plannedExpensesRemaining = budgetVariances(plan, monthlyReport).reduce(
    (sum, item) => sum + Math.max(0, item.remaining),
    0,
  );
  const debtPaymentRemaining = Math.max(
    0,
    plan.plannedDebtPayment - monthlyReport.debtPayments,
  );
  const availableToPlan =
    position.totalCash +
    expectedIncomeRemaining -
    plannedExpensesRemaining -
    debtPaymentRemaining -
    plan.plannedSavings -
    plan.safetyBuffer;

  return {
    totalCash: position.totalCash,
    expectedIncomeRemaining,
    plannedExpensesRemaining,
    debtPaymentRemaining,
    plannedSavings: plan.plannedSavings,
    safetyBuffer: plan.safetyBuffer,
    availableToPlan,
    totalPlanned:
      totalBudget +
      plan.plannedDebtPayment +
      plan.plannedSavings +
      plan.safetyBuffer,
  };
}

export function planPeriod(month: string): { startDate: string; endDate: string } {
  return { startDate: startOfMonth(`${month}-01`), endDate: endOfMonth(`${month}-01`) };
}
