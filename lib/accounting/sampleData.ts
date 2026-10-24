import { addDays, startOfMonth, todayIso } from "./dates.ts";
import type { AccountingData } from "./types.ts";

export function createSampleData(): AccountingData {
  const today = todayIso();
  const monthStart = startOfMonth(today);
  const checkingId = "sample-checking";
  const savingsId = "sample-savings";
  const cardId = "sample-card";
  const mealPlanId = "sample-meal-plan";

  return {
    version: 1,
    profile: {
      onboardingComplete: true,
      isSampleData: true,
      firstName: "Alex",
      priorities: ["make-money-last", "understand-spending", "build-savings"],
      expectedIncomeSource: "Campus job",
      nextIncomeDate: addDays(today, 7),
      nextIncomeAmount: 720,
    },
    assetAccounts: [
      {
        id: checkingId,
        name: "Campus Checking",
        type: "checking",
        openingBalance: 850,
        openingBalanceDate: monthStart,
      },
      {
        id: savingsId,
        name: "Emergency Savings",
        type: "savings",
        openingBalance: 1_200,
        openingBalanceDate: monthStart,
        protectFromSpending: true,
      },
    ],
    liabilityAccounts: [
      {
        id: cardId,
        name: "Student Credit Card",
        type: "credit-card",
        openingBalance: 320,
        openingBalanceDate: monthStart,
        interestRate: 22.9,
        minimumPayment: 35,
        dueDay: 18,
      },
    ],
    mealPlanAccounts: [{
      id: mealPlanId,
      name: "Campus Dining Dollars",
      type: "declining-balance",
      openingBalance: 240,
      openingBalanceDate: monthStart,
      semesterCost: 600,
    }],
    transactions: [
      {
        id: "sample-income",
        type: "income",
        date: addDays(monthStart, 2),
        description: "Campus job paycheck",
        amount: 720,
        destinationAssetAccountId: checkingId,
        category: "wages-salary",
        status: "posted",
        createdAt: `${addDays(monthStart, 2)}T12:00:00.000Z`,
      },
      {
        id: "sample-groceries",
        type: "expense",
        date: addDays(monthStart, 4),
        description: "Weekly groceries",
        amount: 86.42,
        paymentAccountType: "asset",
        paymentAccountId: checkingId,
        category: "groceries",
        status: "posted",
        createdAt: `${addDays(monthStart, 4)}T18:00:00.000Z`,
      },
      {
        id: "sample-books",
        type: "expense",
        date: addDays(monthStart, 6),
        description: "Accounting textbook",
        amount: 94.5,
        paymentAccountType: "liability",
        paymentAccountId: cardId,
        category: "textbooks-school-supplies",
        status: "posted",
        createdAt: `${addDays(monthStart, 6)}T18:00:00.000Z`,
      },
      {
        id: "sample-transfer",
        type: "transfer",
        date: addDays(monthStart, 8),
        description: "Move money to emergency savings",
        amount: 100,
        sourceAssetAccountId: checkingId,
        destinationAssetAccountId: savingsId,
        status: "posted",
        createdAt: `${addDays(monthStart, 8)}T18:00:00.000Z`,
      },
      {
        id: "sample-pending",
        type: "expense",
        date: today,
        description: "Coffee shop — pending",
        amount: 6.75,
        paymentAccountType: "asset",
        paymentAccountId: checkingId,
        category: "uncategorized",
        status: "pending",
        createdAt: `${today}T19:00:00.000Z`,
      },
      {
        id: "sample-meal-use",
        type: "meal-plan-use",
        date: addDays(monthStart, 10),
        description: "Campus dining hall",
        amount: 12.5,
        mealPlanAccountId: mealPlanId,
        category: "dining-out",
        status: "posted",
        createdAt: `${addDays(monthStart, 10)}T18:00:00.000Z`,
      },
    ],
    obligations: [
      { id: "sample-rent", name: "Rent", amount: 650, dueDay: 1, category: "rent-housing" },
      { id: "sample-phone", name: "Phone bill", amount: 55, dueDay: 16, category: "phone-internet" },
    ],
    monthlyPlans: [
      {
        month: today.slice(0, 7),
        expectedIncome: 1_440,
        categoryBudgets: {
          "rent-housing": 650,
          groceries: 65,
          "dining-out": 22,
          "gas-transportation": 30,
          "phone-internet": 55,
          entertainment: 15,
          "textbooks-school-supplies": 100,
        },
        categoryBudgetCadences: {
          "rent-housing": "monthly",
          groceries: "weekly",
          "dining-out": "weekly",
          "gas-transportation": "weekly",
          "phone-internet": "monthly",
          entertainment: "weekly",
          "textbooks-school-supplies": "monthly",
        },
        plannedDebtPayment: 75,
        plannedSavings: 100,
        safetyBuffer: 200,
      },
    ],
    goals: [
      {
        id: "sample-goal",
        name: "New laptop",
        targetAmount: 1_200,
        currentAmount: 350,
        targetDate: addDays(today, 150),
        monthlyContribution: 100,
      },
    ],
  };
}
