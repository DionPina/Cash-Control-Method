import { parseNonNegativeAmount } from "./format.ts";
import { createId } from "./id.ts";
import type { AccountingData, ExpenseCategory, HousingSituation, MealPlanType, StudentPriority } from "./types.ts";

export type OnboardingValues = {
  firstName: string;
  priorities: StudentPriority[];
  checkingName: string;
  checkingBalance: string;
  savingsBalance: string;
  incomeSource: string;
  nextIncomeDate: string;
  expectedIncome: string;
  housingSituation: HousingSituation;
  rent: string;
  rentDueDay: string;
  utilitiesIncluded: string;
  utilities: string;
  mealPlanType: "none" | MealPlanType;
  mealPlanName: string;
  mealPlanBalance: string;
  mealPlanSemesterCost: string;
  mealPlanSwipes: string;
  groceries: string;
  diningOut: string;
  transportation: string;
  otherSpending: string;
  safetyBuffer: string;
  debtName: string;
  debtBalance: string;
  minimumPayment: string;
};

export function buildOnboardingData(values: OnboardingValues, today: string): AccountingData {
  const amount = (value: string) => parseNonNegativeAmount(value) ?? 0;
  const month = today.slice(0, 7);
  const checkingId = createId("asset");
  const savingsId = createId("asset");
  const debtId = createId("liability");
  const rent = amount(values.rent);
  const debtBalance = amount(values.debtBalance);
  const minimumPayment = amount(values.minimumPayment);
  const categoryBudgets: Partial<Record<ExpenseCategory, number>> = {};

  if (rent > 0) categoryBudgets["rent-housing"] = rent;
  if (amount(values.utilities) > 0) categoryBudgets.utilities = amount(values.utilities);
  if (amount(values.groceries) > 0) categoryBudgets.groceries = amount(values.groceries);
  if (amount(values.diningOut) > 0) categoryBudgets["dining-out"] = amount(values.diningOut);
  if (amount(values.transportation) > 0) categoryBudgets["gas-transportation"] = amount(values.transportation);
  if (amount(values.otherSpending) > 0) categoryBudgets["other-expense"] = amount(values.otherSpending);

  return {
    version: 1,
    profile: {
      onboardingComplete: true,
      firstName: values.firstName.trim() || undefined,
      priorities: values.priorities,
      expectedIncomeSource: values.incomeSource.trim() || undefined,
      nextIncomeDate: values.nextIncomeDate || undefined,
      nextIncomeAmount: amount(values.expectedIncome) || undefined,
      housingSituation: values.housingSituation,
    },
    assetAccounts: [
      {
        id: checkingId,
        name: values.checkingName.trim() || "Checking",
        type: "checking",
        openingBalance: amount(values.checkingBalance),
        openingBalanceDate: today,
      },
      ...(amount(values.savingsBalance) > 0 ? [{
        id: savingsId,
        name: "Savings",
        type: "savings" as const,
        openingBalance: amount(values.savingsBalance),
        openingBalanceDate: today,
      }] : []),
    ],
    liabilityAccounts: debtBalance > 0 ? [{
      id: debtId,
      name: values.debtName.trim() || "Credit card or loan",
      type: "credit-card",
      openingBalance: debtBalance,
      openingBalanceDate: today,
      minimumPayment: minimumPayment || undefined,
    }] : [],
    mealPlanAccounts: values.mealPlanType !== "none" ? [{
      id: createId("meal-plan"),
      name: values.mealPlanName.trim() || "Campus meal plan",
      type: values.mealPlanType,
      openingBalance: amount(values.mealPlanBalance),
      openingBalanceDate: today,
      semesterCost: amount(values.mealPlanSemesterCost) || undefined,
      swipesRemaining: values.mealPlanType === "swipes" ? amount(values.mealPlanSwipes) : undefined,
    }] : [],
    transactions: [],
    obligations: rent > 0 ? [{
      id: createId("obligation"),
      name: "Rent or housing",
      amount: rent,
      dueDay: Math.min(31, Math.max(1, Number(values.rentDueDay) || 1)),
      category: "rent-housing",
    }] : [],
    monthlyPlans: [{
      month,
      expectedIncome: amount(values.expectedIncome),
      categoryBudgets,
      categoryBudgetCadences: {
        ...(rent > 0 ? { "rent-housing": "monthly" as const } : {}),
        ...(amount(values.utilities) > 0 ? { utilities: "monthly" as const } : {}),
        ...(amount(values.groceries) > 0 ? { groceries: "weekly" as const } : {}),
        ...(amount(values.diningOut) > 0 ? { "dining-out": "weekly" as const } : {}),
        ...(amount(values.transportation) > 0 ? { "gas-transportation": "weekly" as const } : {}),
        ...(amount(values.otherSpending) > 0 ? { "other-expense": "weekly" as const } : {}),
      },
      plannedDebtPayment: minimumPayment,
      plannedSavings: 0,
      safetyBuffer: amount(values.safetyBuffer),
    }],
    goals: [],
  };
}
