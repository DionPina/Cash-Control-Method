import { EXPENSE_CATEGORIES, getLabel } from "./constants.ts";
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "./dates.ts";
import { calculateFinancialPosition } from "./engine.ts";
import { formatCurrency } from "./format.ts";
import type {
  AccountingData,
  ExpenseBreakdownItem,
  ExpenseCategory,
  IncomeCategory,
  PeriodReport,
  Transaction,
} from "./types.ts";

type ExpenseEntry = {
  description: string;
  amount: number;
  category: ExpenseCategory;
};

function postedTransactionsInPeriod(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
): Transaction[] {
  return transactions.filter(
    (transaction) =>
      transaction.status === "posted" &&
      transaction.date >= startDate &&
      transaction.date <= endDate,
  );
}

function expenseEntries(transactions: Transaction[]): ExpenseEntry[] {
  return transactions.flatMap((transaction): ExpenseEntry[] => {
    if (transaction.type === "expense") {
      return [
        {
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
        },
      ];
    }
    if (transaction.type === "debt-payment" && transaction.interestAmount > 0) {
      return [
        {
          description: `${transaction.description} — interest`,
          amount: transaction.interestAmount,
          category: "interest",
        },
      ];
    }
    if (transaction.type === "meal-plan-use") {
      return [{ description: transaction.description, amount: transaction.amount, category: transaction.category }];
    }
    return [];
  });
}

function createExpenseBreakdown(entries: ExpenseEntry[]): ExpenseBreakdownItem[] {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const grouped = new Map<ExpenseCategory, number>();
  for (const entry of entries) {
    grouped.set(entry.category, (grouped.get(entry.category) ?? 0) + entry.amount);
  }

  return [...grouped.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function buildObservations(report: Omit<PeriodReport, "observations">): string[] {
  const observations: string[] = [];
  const largestCategory = report.expenseBreakdown[0];
  if (largestCategory) {
    observations.push(
      `${getLabel(EXPENSE_CATEGORIES, largestCategory.category)} was your largest expense category at ${formatCurrency(largestCategory.amount)}.`,
    );
  }

  observations.push(
    `You received ${formatCurrency(report.incomeFunding)} in income and non-borrowed funding and incurred ${formatCurrency(report.totalExpensesIncurred)} of expenses.`,
  );

  const cashDirection = report.netCashChange >= 0 ? "increased" : "decreased";
  observations.push(
    `Total cash ${cashDirection} by ${formatCurrency(Math.abs(report.netCashChange))}.`,
  );

  const liabilityDirection = report.liabilityChange >= 0 ? "increased" : "decreased";
  observations.push(
    `Liabilities ${liabilityDirection} by ${formatCurrency(Math.abs(report.liabilityChange))}.`,
  );

  if (report.uncategorizedCount > 0) {
    observations.push(
      `You have ${report.uncategorizedCount} uncategorized posted transaction${report.uncategorizedCount === 1 ? "" : "s"} to review.`,
    );
  }

  return observations;
}

export function generatePeriodReport(
  data: AccountingData,
  startDate: string,
  endDate: string,
): PeriodReport {
  const transactions = postedTransactionsInPeriod(data.transactions, startDate, endDate);
  const beginningPosition = calculateFinancialPosition(data, {
    date: startDate,
    includeDate: false,
  });
  const endingPosition = calculateFinancialPosition(data, {
    date: endDate,
    includeDate: true,
  });
  const entries = expenseEntries(transactions);
  const expenseBreakdown = createExpenseBreakdown(entries);
  const largestExpense = entries.length
    ? entries.reduce((largest, entry) => (entry.amount > largest.amount ? entry : largest))
    : null;

  const incomeFunding = transactions.reduce(
    (sum, transaction) => sum + (transaction.type === "income" ? transaction.amount : 0),
    0,
  );
  const borrowedFunds = transactions.reduce(
    (sum, transaction) => sum + (transaction.type === "borrowing" ? transaction.amount : 0),
    0,
  );
  const cashExpensesPaid = transactions.reduce(
    (sum, transaction) =>
      sum +
      (transaction.type === "expense" && transaction.paymentAccountType === "asset"
        ? transaction.amount
        : 0),
    0,
  );
  const debtPayments = transactions.reduce(
    (sum, transaction) =>
      sum + (transaction.type === "debt-payment" ? transaction.amount : 0),
    0,
  );
  const mealPlanFundingCash = transactions.reduce(
    (sum, transaction) => sum + (transaction.type === "meal-plan-funding" && transaction.paymentAccountType === "asset" ? transaction.amount : 0),
    0,
  );
  const debtPrincipalPaid = transactions.reduce(
    (sum, transaction) =>
      sum + (transaction.type === "debt-payment" ? transaction.principalAmount : 0),
    0,
  );
  const interestExpensePaid = transactions.reduce(
    (sum, transaction) =>
      sum + (transaction.type === "debt-payment" ? transaction.interestAmount : 0),
    0,
  );
  const transfersIn = transactions.reduce(
    (sum, transaction) => sum + (transaction.type === "transfer" ? transaction.amount : 0),
    0,
  );
  const transfersOut = transfersIn;
  const totalExpensesIncurred = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const uncategorizedTransactions = transactions.filter(
    (transaction) =>
      transaction.type === "expense" && transaction.category === "uncategorized",
  );
  const liabilityBorrowing = borrowedFunds;
  const liabilityPurchases = transactions.reduce(
    (sum, transaction) =>
      sum +
      (transaction.type === "expense" && transaction.paymentAccountType === "liability"
        ? transaction.amount
        : 0),
    0,
  );
  const liabilityMealPlanFunding = transactions.reduce(
    (sum, transaction) => sum + (transaction.type === "meal-plan-funding" && transaction.paymentAccountType === "liability" ? transaction.amount : 0),
    0,
  );

  const reportWithoutObservations: Omit<PeriodReport, "observations"> = {
    startDate,
    endDate,
    beginningPosition,
    endingPosition,
    transactions,
    incomeFunding,
    borrowedFunds,
    cashExpensesPaid,
    mealPlanFundingCash,
    debtPayments,
    debtPrincipalPaid,
    interestExpensePaid,
    transfersIn,
    transfersOut,
    totalExpensesIncurred,
    expenseBreakdown,
    largestExpense: largestExpense
      ? { description: largestExpense.description, amount: largestExpense.amount }
      : null,
    postedExpenseCount: entries.length,
    uncategorizedExpenseTotal: uncategorizedTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    ),
    uncategorizedCount: uncategorizedTransactions.length,
    netCashChange: endingPosition.totalCash - beginningPosition.totalCash,
    liabilityChange:
      endingPosition.totalLiabilities - beginningPosition.totalLiabilities,
    netPositionChange:
      endingPosition.netFinancialPosition - beginningPosition.netFinancialPosition,
    liabilityBorrowing,
    liabilityPurchases,
    liabilityMealPlanFunding,
  };

  return {
    ...reportWithoutObservations,
    observations: buildObservations(reportWithoutObservations),
  };
}

export function generateWeeklyReport(data: AccountingData, selectedDate: string): PeriodReport {
  const startDate = startOfWeek(selectedDate);
  return generatePeriodReport(data, startDate, endOfWeek(startDate));
}

export function generateMonthlyReport(data: AccountingData, selectedDate: string): PeriodReport {
  const startDate = startOfMonth(selectedDate);
  return generatePeriodReport(data, startDate, endOfMonth(startDate));
}

export type IncomeFundingGroups = {
  earnedIncome: number;
  scholarshipsGrants: number;
  familyGifts: number;
  refundsOther: number;
  borrowedFunding: number;
};

export function groupIncomeAndFunding(report: PeriodReport): IncomeFundingGroups {
  const groups: IncomeFundingGroups = {
    earnedIncome: 0,
    scholarshipsGrants: 0,
    familyGifts: 0,
    refundsOther: 0,
    borrowedFunding: report.borrowedFunds,
  };

  for (const transaction of report.transactions) {
    if (transaction.type !== "income") continue;
    const category: IncomeCategory = transaction.category;
    if (["wages-salary", "tips", "gig-work", "internship-income"].includes(category)) {
      groups.earnedIncome += transaction.amount;
    } else if (["scholarship", "grant"].includes(category)) {
      groups.scholarshipsGrants += transaction.amount;
    } else if (["family-support", "gift"].includes(category)) {
      groups.familyGifts += transaction.amount;
    } else {
      groups.refundsOther += transaction.amount;
    }
  }

  return groups;
}

export type WeeklyExpenseTotal = {
  startDate: string;
  endDate: string;
  amount: number;
};

export function weeklyExpenseTotalsForMonth(
  data: AccountingData,
  selectedMonth: string,
): WeeklyExpenseTotal[] {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const totals: WeeklyExpenseTotal[] = [];
  let cursor = monthStart;

  while (cursor <= monthEnd) {
    const weekEnd = endOfWeek(cursor);
    const clippedEnd = weekEnd > monthEnd ? monthEnd : weekEnd;
    const report = generatePeriodReport(data, cursor, clippedEnd);
    totals.push({
      startDate: cursor,
      endDate: clippedEnd,
      amount: report.totalExpensesIncurred,
    });
    cursor = addDays(clippedEnd, 1);
  }

  return totals;
}
