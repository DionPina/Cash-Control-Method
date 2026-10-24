import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAssetBalance,
  calculateFinancialPosition,
  calculateLiabilityBalance,
  calculateMealPlanBalance,
} from "../lib/accounting/engine.ts";
import {
  generateMonthlyReport,
  groupIncomeAndFunding,
} from "../lib/accounting/reports.ts";
import {
  budgetVariances,
  budgetAmountForMonth,
  calculateProtectedCash,
  calculatePlanProgress,
  calculateSafeToSpend,
  planForMonth,
  totalCategoryBudget,
} from "../lib/accounting/planning.ts";
import {
  createAccountingBackup,
  migrateAndValidate,
  parseAccountingBackup,
} from "../lib/accounting/persistence.ts";
import { buildOnboardingData } from "../lib/accounting/onboarding.ts";
import { createSampleData } from "../lib/accounting/sampleData.ts";
import {
  validateAssetAccount,
  validateTransaction,
} from "../lib/accounting/validation.ts";

const checking = {
  id: "checking",
  name: "Checking",
  type: "checking",
  openingBalance: 1_000,
  openingBalanceDate: "2026-01-01",
};
const savings = {
  id: "savings",
  name: "Savings",
  type: "savings",
  openingBalance: 500,
  openingBalanceDate: "2026-01-01",
};
const card = {
  id: "card",
  name: "Credit Card",
  type: "credit-card",
  openingBalance: 300,
  openingBalanceDate: "2026-01-01",
};
const loan = {
  id: "loan",
  name: "Student Loan",
  type: "student-loan",
  openingBalance: 2_000,
  openingBalanceDate: "2026-01-01",
};

const transactions = [
  {
    id: "income",
    type: "income",
    date: "2026-01-02",
    description: "Paycheck",
    amount: 1_000,
    destinationAssetAccountId: "checking",
    category: "wages-salary",
    status: "posted",
    createdAt: "2026-01-02T12:00:00.000Z",
  },
  {
    id: "cash-expense",
    type: "expense",
    date: "2026-01-03",
    description: "Groceries",
    amount: 100,
    paymentAccountType: "asset",
    paymentAccountId: "checking",
    category: "groceries",
    status: "posted",
    createdAt: "2026-01-03T12:00:00.000Z",
  },
  {
    id: "card-expense",
    type: "expense",
    date: "2026-01-04",
    description: "Books",
    amount: 200,
    paymentAccountType: "liability",
    paymentAccountId: "card",
    category: "textbooks-school-supplies",
    status: "posted",
    createdAt: "2026-01-04T12:00:00.000Z",
  },
  {
    id: "borrowing",
    type: "borrowing",
    date: "2026-01-05",
    description: "Loan proceeds",
    amount: 1_000,
    destinationAssetAccountId: "checking",
    liabilityAccountId: "loan",
    status: "posted",
    createdAt: "2026-01-05T12:00:00.000Z",
  },
  {
    id: "transfer",
    type: "transfer",
    date: "2026-01-06",
    description: "Move to savings",
    amount: 200,
    sourceAssetAccountId: "checking",
    destinationAssetAccountId: "savings",
    status: "posted",
    createdAt: "2026-01-06T12:00:00.000Z",
  },
  {
    id: "debt-payment",
    type: "debt-payment",
    date: "2026-01-07",
    description: "Card payment",
    amount: 110,
    cashAccountId: "checking",
    liabilityAccountId: "card",
    principalAmount: 100,
    interestAmount: 10,
    status: "posted",
    createdAt: "2026-01-07T12:00:00.000Z",
  },
  {
    id: "pending",
    type: "expense",
    date: "2026-01-08",
    description: "Pending purchase",
    amount: 999,
    paymentAccountType: "asset",
    paymentAccountId: "checking",
    category: "uncategorized",
    status: "pending",
    createdAt: "2026-01-08T12:00:00.000Z",
  },
];

const data = {
  version: 1,
  assetAccounts: [checking, savings],
  liabilityAccounts: [card, loan],
  transactions,
};

test("posted ledger activity produces balanced cash and liability balances", () => {
  const position = calculateFinancialPosition(data, {
    date: "2026-01-31",
    includeDate: true,
  });

  assert.equal(position.totalCash, 3_290);
  assert.equal(position.totalLiabilities, 3_400);
  assert.equal(position.netFinancialPosition, -110);
});

test("credit-card expenses increase liabilities without decreasing cash", () => {
  const cashBefore = calculateAssetBalance(checking, transactions, {
    date: "2026-01-03",
    includeDate: true,
  });
  const cashAfter = calculateAssetBalance(checking, transactions, {
    date: "2026-01-04",
    includeDate: true,
  });
  const cardBalance = calculateLiabilityBalance(card, transactions, {
    date: "2026-01-04",
    includeDate: true,
  });

  assert.equal(cashBefore, 1_900);
  assert.equal(cashAfter, 1_900);
  assert.equal(cardBalance, 500);
});

test("a transfer changes account balances but not total cash", () => {
  const before = calculateFinancialPosition(data, {
    date: "2026-01-05",
    includeDate: true,
  });
  const after = calculateFinancialPosition(data, {
    date: "2026-01-06",
    includeDate: true,
  });

  assert.equal(before.totalCash, after.totalCash);
  assert.equal(after.assetBalances.find((item) => item.id === "checking").balance, 2_700);
  assert.equal(after.assetBalances.find((item) => item.id === "savings").balance, 700);
});

test("debt payment reduces cash by total and liability only by principal", () => {
  const checkingBalance = calculateAssetBalance(checking, transactions, {
    date: "2026-01-07",
    includeDate: true,
  });
  const cardBalance = calculateLiabilityBalance(card, transactions, {
    date: "2026-01-07",
    includeDate: true,
  });

  assert.equal(checkingBalance, 2_590);
  assert.equal(cardBalance, 400);
});

test("pending transactions do not affect official balances or reports", () => {
  const position = calculateFinancialPosition(data, {
    date: "2026-01-31",
    includeDate: true,
  });
  const report = generateMonthlyReport(data, "2026-01-15");

  assert.equal(position.totalCash, 3_290);
  assert.equal(report.transactions.some((transaction) => transaction.id === "pending"), false);
  assert.equal(report.uncategorizedCount, 0);
});

test("monthly report separates income, borrowing, expense, and cash activity", () => {
  const report = generateMonthlyReport(data, "2026-01-15");

  assert.equal(report.beginningPosition.totalCash, 1_500);
  assert.equal(report.endingPosition.totalCash, 3_290);
  assert.equal(report.incomeFunding, 1_000);
  assert.equal(report.borrowedFunds, 1_000);
  assert.equal(report.cashExpensesPaid, 100);
  assert.equal(report.debtPrincipalPaid, 100);
  assert.equal(report.interestExpensePaid, 10);
  assert.equal(report.totalExpensesIncurred, 310);
  assert.equal(report.liabilityPurchases, 200);
  assert.equal(report.netCashChange, 1_790);
  assert.equal(report.transfersIn - report.transfersOut, 0);
});

test("borrowed funding is never included in income subtotal", () => {
  const groups = groupIncomeAndFunding(generateMonthlyReport(data, "2026-01-15"));

  assert.equal(groups.earnedIncome, 1_000);
  assert.equal(groups.borrowedFunding, 1_000);
  assert.equal(groups.earnedIncome + groups.scholarshipsGrants + groups.familyGifts + groups.refundsOther, 1_000);
});

test("monthly plans keep category budgets connected to one total", () => {
  const plannedData = {
    ...data,
    monthlyPlans: [
      {
        month: "2026-01",
        expectedIncome: 1_500,
        categoryBudgets: {
          groceries: 200,
          "textbooks-school-supplies": 300,
        },
        plannedDebtPayment: 200,
        plannedSavings: 100,
        safetyBuffer: 100,
      },
    ],
  };

  const plan = planForMonth(plannedData, "2026-01");
  assert.equal(totalCategoryBudget(plan), 500);
  assert.equal(plan.expectedIncome, 1_500);
});

test("weekly plan amounts retain their cadence and normalize for a monthly view", () => {
  assert.equal(budgetAmountForMonth(75, "weekly"), 325);
  assert.equal(budgetAmountForMonth(40, "daily").toFixed(2), "1216.67");
  assert.equal(budgetAmountForMonth(500, "semester"), 100);
});

test("meal-plan funding moves cash into restricted value and usage records food expense", () => {
  const mealPlan = { id: "meal", name: "Dining Dollars", type: "declining-balance", openingBalance: 100, openingBalanceDate: "2026-01-01" };
  const mealTransactions = [
    { id: "fund", type: "meal-plan-funding", date: "2026-01-10", description: "Dining dollars reload", amount: 50, paymentAccountType: "asset", paymentAccountId: "checking", mealPlanAccountId: "meal", status: "posted", createdAt: "2026-01-10T12:00:00.000Z" },
    { id: "use", type: "meal-plan-use", date: "2026-01-11", description: "Campus cafe", amount: 20, mealPlanAccountId: "meal", category: "dining-out", status: "posted", createdAt: "2026-01-11T12:00:00.000Z" },
  ];
  const mealData = { version: 1, assetAccounts: [checking], liabilityAccounts: [], mealPlanAccounts: [mealPlan], transactions: mealTransactions };
  const position = calculateFinancialPosition(mealData, { date: "2026-01-31", includeDate: true });
  const report = generateMonthlyReport(mealData, "2026-01-15");

  assert.equal(position.totalCash, 950);
  assert.equal(calculateMealPlanBalance(mealPlan, mealTransactions, { date: "2026-01-31", includeDate: true }), 130);
  assert.equal(position.totalRestricted, 130);
  assert.equal(report.mealPlanFundingCash, 50);
  assert.equal(report.totalExpensesIncurred, 20);
});

test("budget variance compares posted expenses with the matching category plan", () => {
  const plan = {
    month: "2026-01",
    expectedIncome: 1_500,
    categoryBudgets: {
      groceries: 200,
      "textbooks-school-supplies": 300,
    },
    plannedDebtPayment: 200,
    plannedSavings: 100,
    safetyBuffer: 100,
  };
  const variances = budgetVariances(plan, generateMonthlyReport(data, "2026-01-15"));

  assert.equal(variances.find((item) => item.category === "groceries").remaining, 100);
  assert.equal(
    variances.find((item) => item.category === "textbooks-school-supplies").remaining,
    100,
  );
  assert.equal(variances.find((item) => item.category === "interest").remaining, -10);
});

test("plan snapshot keeps expected amounts separate from posted activity", () => {
  const plannedData = {
    ...data,
    monthlyPlans: [
      {
        month: "2026-01",
        expectedIncome: 1_500,
        categoryBudgets: {
          groceries: 200,
          "textbooks-school-supplies": 300,
        },
        plannedDebtPayment: 200,
        plannedSavings: 100,
        safetyBuffer: 100,
      },
    ],
  };
  const snapshot = calculatePlanProgress(plannedData, "2026-01-15");

  assert.equal(snapshot.totalCash, 3_290);
  assert.equal(snapshot.expectedIncomeRemaining, 500);
  assert.equal(snapshot.plannedExpensesRemaining, 200);
  assert.equal(snapshot.debtPaymentRemaining, 90);
  assert.equal(snapshot.savingsContributed, 200);
  assert.equal(snapshot.savingsRemaining, 0);
  assert.equal(snapshot.availableAfterPlan, 3_400);
});

test("plan progress counts only expected income that has not arrived", () => {
  const plannedData = {
    ...data,
    monthlyPlans: [{
      month: "2026-01",
      expectedIncome: 1_500,
      categoryBudgets: {},
      plannedDebtPayment: 0,
      plannedSavings: 0,
      safetyBuffer: 0,
    }],
  };
  const progress = calculatePlanProgress(plannedData, "2026-01-15");

  assert.equal(progress.totalCash, 3_290);
  assert.equal(progress.expectedIncomeRemaining, 500);
  assert.equal(progress.availableAfterPlan, 3_790);
});

test("required payments supplement category budgets without being counted twice", () => {
  const basePlan = {
    month: "2026-01",
    expectedIncome: 0,
    categoryBudgets: { "rent-housing": 650 },
    plannedDebtPayment: 0,
    plannedSavings: 0,
    safetyBuffer: 0,
  };
  const covered = calculatePlanProgress({
    ...data,
    obligations: [{ id: "rent", name: "Rent", amount: 650, dueDay: 20, category: "rent-housing" }],
    monthlyPlans: [basePlan],
  }, "2026-01-15");
  const uncovered = calculatePlanProgress({
    ...data,
    obligations: [{ id: "rent", name: "Rent", amount: 800, dueDay: 20, category: "rent-housing" }],
    monthlyPlans: [basePlan],
  }, "2026-01-15");

  assert.equal(covered.uncoveredRequiredPayments, 0);
  assert.equal(uncovered.uncoveredRequiredPayments, 150);
});

test("goal contributions and savings transfers connect to the plan once", () => {
  const progress = calculatePlanProgress({
    ...data,
    goals: [{ id: "goal", name: "Laptop", targetAmount: 1_000, currentAmount: 0, monthlyContribution: 250 }],
    monthlyPlans: [{
      month: "2026-01",
      expectedIncome: 0,
      categoryBudgets: {},
      plannedDebtPayment: 0,
      plannedSavings: 100,
      safetyBuffer: 0,
    }],
  }, "2026-01-15");

  assert.equal(progress.savingsTarget, 250);
  assert.equal(progress.savingsContributed, 200);
  assert.equal(progress.savingsRemaining, 50);
});

test("safe-to-spend stops at next income and protects known bills", () => {
  const snapshot = calculateSafeToSpend({
    ...data,
    profile: { onboardingComplete: true, priorities: [], nextIncomeDate: "2026-01-20" },
    obligations: [{ id: "phone", name: "Phone", amount: 60, dueDay: 18, category: "phone-internet" }],
    monthlyPlans: [{
      month: "2026-01",
      expectedIncome: 0,
      categoryBudgets: {},
      plannedDebtPayment: 0,
      plannedSavings: 0,
      safetyBuffer: 100,
    }],
  }, "2026-01-15");

  assert.equal(snapshot.horizonDate, "2026-01-20");
  assert.equal(snapshot.upcomingRequiredPayments, 60);
  assert.equal(snapshot.pendingCashOutflows, 999);
  assert.equal(snapshot.safeToSpend, 2_131);
  assert.equal(snapshot.isCalculated, true);
});

test("safe-to-spend is not presented as calculated before needs are planned", () => {
  const snapshot = calculateSafeToSpend({
    ...data,
    transactions: [],
    monthlyPlans: [{
      month: "2026-01",
      expectedIncome: 1_000,
      categoryBudgets: {},
      plannedDebtPayment: 0,
      plannedSavings: 0,
      safetyBuffer: 0,
    }],
  }, "2026-01-15");

  assert.equal(snapshot.cashNow, 1_500);
  assert.equal(snapshot.isCalculated, false);
});

test("safe-to-spend protects the share of planned needs before next income", () => {
  const snapshot = calculateSafeToSpend({
    ...data,
    transactions: [],
    profile: { onboardingComplete: true, priorities: [], nextIncomeDate: "2026-01-20" },
    monthlyPlans: [{
      month: "2026-01",
      expectedIncome: 0,
      categoryBudgets: { groceries: 310 },
      plannedDebtPayment: 0,
      plannedSavings: 0,
      safetyBuffer: 0,
    }],
  }, "2026-01-15");

  assert.equal(snapshot.isCalculated, true);
  assert.equal(snapshot.plannedNeedsRemaining.toFixed(2), "109.41");
  assert.equal(snapshot.safeToSpend.toFixed(2), "1390.59");
});

test("protected accounts and goal reserves are not subtracted twice", () => {
  const protectedData = {
    ...data,
    assetAccounts: [checking, { ...savings, protectFromSpending: true }],
    transactions: [],
    goals: [{ id: "emergency", name: "Emergency fund", targetAmount: 2_000, currentAmount: 350, monthlyContribution: 0 }],
  };
  const protection = calculateProtectedCash(protectedData, "2026-01-15");

  assert.equal(protection.accountProtectedBalance, 500);
  assert.equal(protection.goalReservedBalance, 350);
  assert.equal(protection.protectedCash, 500);
});

test("goal reserves still protect cash when they exceed protected-account balances", () => {
  const protection = calculateProtectedCash({
    ...data,
    assetAccounts: [checking, { ...savings, protectFromSpending: true }],
    transactions: [],
    goals: [{ id: "laptop", name: "Laptop", targetAmount: 1_000, currentAmount: 700, monthlyContribution: 0 }],
  }, "2026-01-15");

  assert.equal(protection.accountProtectedBalance, 500);
  assert.equal(protection.goalReservedBalance, 700);
  assert.equal(protection.protectedCash, 700);
});

test("pending credit purchases do not reduce pending cash outflows", () => {
  const snapshot = calculateSafeToSpend({
    ...data,
    transactions: [{ ...transactions.find((item) => item.id === "pending"), paymentAccountType: "liability", paymentAccountId: "card" }],
    monthlyPlans: [{
      month: "2026-01",
      expectedIncome: 0,
      categoryBudgets: { groceries: 100 },
      plannedDebtPayment: 0,
      plannedSavings: 0,
      safetyBuffer: 0,
    }],
  }, "2026-01-15");

  assert.equal(snapshot.pendingCashOutflows, 0);
});

test("backup round-trip validates nested accounting records", () => {
  const backup = createAccountingBackup(data, "2026-01-31T00:00:00.000Z");
  const parsed = parseAccountingBackup(JSON.parse(JSON.stringify(backup)));

  assert.equal(parsed.ok, true);
  assert.equal(parsed.ok && parsed.data.transactions.length, transactions.length);
});

test("sample data stays labeled and protects emergency savings", () => {
  const sample = createSampleData();
  const emergency = sample.assetAccounts.find((account) => account.id === "sample-savings");

  assert.equal(sample.profile.isSampleData, true);
  assert.equal(emergency.protectFromSpending, true);
  assert.equal(parseAccountingBackup(createAccountingBackup(sample)).ok, true);
});

test("legacy sample records gain the demo label and savings protection", () => {
  const sample = createSampleData();
  delete sample.profile.isSampleData;
  delete sample.assetAccounts.find((account) => account.id === "sample-savings").protectFromSpending;
  const migrated = migrateAndValidate(sample);

  assert.equal(migrated.ok, true);
  assert.equal(migrated.ok && migrated.data.profile.isSampleData, true);
  assert.equal(migrated.ok && migrated.data.assetAccounts.find((account) => account.id === "sample-savings").protectFromSpending, true);
});

test("stored data validation rejects malformed nested records", () => {
  const malformed = {
    ...data,
    transactions: [{ ...transactions[0], amount: "one thousand" }],
  };
  const parsed = migrateAndValidate(malformed);

  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /Transaction 1 is invalid/);
});

test("onboarding creates one connected opening position and monthly plan", () => {
  const onboarding = buildOnboardingData({
    firstName: "Sam",
    priorities: ["make-money-last", "build-savings"],
    checkingName: "Student Checking",
    checkingBalance: "800",
    savingsBalance: "250",
    incomeSource: "Campus job",
    nextIncomeDate: "2026-01-23",
    expectedIncome: "900",
    housingSituation: "dorm",
    rent: "500",
    rentDueDay: "1",
    utilitiesIncluded: "yes",
    utilities: "",
    mealPlanType: "declining-balance",
    mealPlanName: "Campus Dining",
    mealPlanBalance: "150",
    mealPlanSemesterCost: "600",
    mealPlanSwipes: "",
    groceries: "200",
    diningOut: "25",
    transportation: "80",
    otherSpending: "50",
    plannedSavings: "75",
    safetyBuffer: "100",
    debtName: "Student Card",
    debtBalance: "300",
    minimumPayment: "35",
    debtDueDay: "18",
  }, "2026-01-15");

  assert.equal(onboarding.profile.onboardingComplete, true);
  assert.equal(onboarding.assetAccounts.length, 2);
  assert.equal(onboarding.liabilityAccounts[0].openingBalance, 300);
  assert.equal(onboarding.obligations[0].amount, 500);
  assert.deepEqual(onboarding.monthlyPlans[0].categoryBudgets, {
    "rent-housing": 500,
    groceries: 200,
    "dining-out": 25,
    "gas-transportation": 80,
    "other-expense": 50,
  });
  assert.equal(onboarding.monthlyPlans[0].plannedDebtPayment, 35);
  assert.equal(onboarding.monthlyPlans[0].plannedSavings, 75);
  assert.equal(onboarding.liabilityAccounts[0].dueDay, 18);
  assert.equal(onboarding.mealPlanAccounts[0].openingBalance, 150);
  assert.equal(onboarding.monthlyPlans[0].categoryBudgetCadences.groceries, "weekly");
});

test("transaction validation rejects a transfer to the same account", () => {
  const invalidTransfer = {
    ...transactions.find((transaction) => transaction.id === "transfer"),
    id: "invalid-transfer",
    sourceAssetAccountId: "checking",
    destinationAssetAccountId: "checking",
  };

  const errors = validateTransaction(invalidTransfer, data);
  assert.ok(errors.some((error) => error.includes("must be different")));
});

test("transaction validation prevents overspending a restricted meal-plan balance", () => {
  const mealPlan = { id: "meal", name: "Dining Dollars", type: "declining-balance", openingBalance: 40, openingBalanceDate: "2026-01-01" };
  const errors = validateTransaction({
    id: "meal-use",
    type: "meal-plan-use",
    date: "2026-01-10",
    description: "Campus cafe",
    amount: 50,
    mealPlanAccountId: "meal",
    category: "dining-out",
    status: "posted",
    createdAt: "2026-01-10T12:00:00.000Z",
  }, { ...data, mealPlanAccounts: [mealPlan] });

  assert.ok(errors.some((error) => error.includes("restricted balance")));
});

test("transaction validation rejects principal greater than the posted balance", () => {
  const invalidPayment = {
    ...transactions.find((transaction) => transaction.id === "debt-payment"),
    id: "invalid-payment",
    amount: 1_001,
    principalAmount: 1_000,
    interestAmount: 1,
    date: "2026-01-04",
  };

  const errors = validateTransaction(invalidPayment, data);
  assert.ok(errors.some((error) => error.includes("posted balance owed")));
});

test("transaction validation rejects activity before an account opening date", () => {
  const invalidIncome = {
    ...transactions.find((transaction) => transaction.id === "income"),
    id: "early-income",
    date: "2025-12-31",
  };

  const errors = validateTransaction(invalidIncome, data);
  assert.ok(errors.some((error) => error.includes("opening balance date")));
});

test("account validation rejects moving an opening date after existing activity", () => {
  const errors = validateAssetAccount(
    { ...checking, openingBalanceDate: "2026-01-03" },
    transactions,
  );

  assert.ok(errors.some((error) => error.includes("after a transaction")));
});
