import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAssetBalance,
  calculateFinancialPosition,
  calculateLiabilityBalance,
} from "../lib/accounting/engine.ts";
import {
  generateMonthlyReport,
  groupIncomeAndFunding,
} from "../lib/accounting/reports.ts";
import {
  budgetVariances,
  createPlanSnapshot,
  planForMonth,
  totalCategoryBudget,
} from "../lib/accounting/planning.ts";
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
  const monthly = generateMonthlyReport(plannedData, "2026-01-15");
  const snapshot = createPlanSnapshot(plannedData, "2026-01-15", monthly);

  assert.equal(snapshot.totalCash, 3_290);
  assert.equal(snapshot.expectedIncomeRemaining, 500);
  assert.equal(snapshot.plannedExpensesRemaining, 200);
  assert.equal(snapshot.debtPaymentRemaining, 90);
  assert.equal(snapshot.availableToPlan, 3_300);
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
