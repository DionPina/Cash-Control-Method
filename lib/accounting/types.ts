export type AssetAccountType =
  | "checking"
  | "savings"
  | "cash"
  | "other-cash";

export type LiabilityAccountType =
  | "credit-card"
  | "student-loan"
  | "auto-loan"
  | "personal-loan"
  | "buy-now-pay-later"
  | "family-friends"
  | "unpaid-bill"
  | "other-liability";

export type TransactionStatus = "posted" | "pending";
export type TransactionType =
  | "income"
  | "expense"
  | "borrowing"
  | "debt-payment"
  | "transfer";

export type IncomeCategory =
  | "wages-salary"
  | "tips"
  | "gig-work"
  | "internship-income"
  | "scholarship"
  | "grant"
  | "family-support"
  | "gift"
  | "refund"
  | "other-non-borrowed";

export type ExpenseCategory =
  | "rent-housing"
  | "utilities"
  | "phone-internet"
  | "insurance"
  | "groceries"
  | "dining-out"
  | "gas-transportation"
  | "tuition-fees"
  | "textbooks-school-supplies"
  | "medical-healthcare"
  | "entertainment"
  | "shopping-clothing"
  | "subscriptions"
  | "interest"
  | "bank-financial-fees"
  | "other-expense"
  | "uncategorized";

export type AssetAccount = {
  id: string;
  name: string;
  type: AssetAccountType;
  openingBalance: number;
  openingBalanceDate: string;
};

export type LiabilityAccount = {
  id: string;
  name: string;
  type: LiabilityAccountType;
  openingBalance: number;
  openingBalanceDate: string;
  interestRate?: number;
  minimumPayment?: number;
  dueDay?: number;
};

type BaseTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  note?: string;
  createdAt: string;
};

export type IncomeTransaction = BaseTransaction & {
  type: "income";
  destinationAssetAccountId: string;
  category: IncomeCategory;
};

export type ExpenseTransaction = BaseTransaction & {
  type: "expense";
  paymentAccountType: "asset" | "liability";
  paymentAccountId: string;
  category: ExpenseCategory;
};

export type BorrowingTransaction = BaseTransaction & {
  type: "borrowing";
  destinationAssetAccountId: string;
  liabilityAccountId: string;
};

export type DebtPaymentTransaction = BaseTransaction & {
  type: "debt-payment";
  cashAccountId: string;
  liabilityAccountId: string;
  principalAmount: number;
  interestAmount: number;
};

export type TransferTransaction = BaseTransaction & {
  type: "transfer";
  sourceAssetAccountId: string;
  destinationAssetAccountId: string;
};

export type Transaction =
  | IncomeTransaction
  | ExpenseTransaction
  | BorrowingTransaction
  | DebtPaymentTransaction
  | TransferTransaction;

export type AccountingData = {
  version: 1;
  assetAccounts: AssetAccount[];
  liabilityAccounts: LiabilityAccount[];
  transactions: Transaction[];
  profile?: StudentProfile;
  obligations?: Obligation[];
  monthlyPlans?: MonthlyPlan[];
  goals?: SavingsGoal[];
};

export type StudentPriority =
  | "make-money-last"
  | "stay-ahead-of-bills"
  | "understand-spending"
  | "control-spending"
  | "build-savings"
  | "reduce-debt";

export type StudentProfile = {
  onboardingComplete: boolean;
  firstName?: string;
  priorities: StudentPriority[];
  expectedIncomeSource?: string;
  nextIncomeDate?: string;
  nextIncomeAmount?: number;
};

export type Obligation = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: ExpenseCategory;
};

export type MonthlyPlan = {
  month: string;
  expectedIncome: number;
  categoryBudgets: Partial<Record<ExpenseCategory, number>>;
  plannedDebtPayment: number;
  plannedSavings: number;
  safetyBuffer: number;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  monthlyContribution: number;
};

export type AccountBalance = {
  id: string;
  name: string;
  balance: number;
};

export type FinancialPosition = {
  assetBalances: AccountBalance[];
  liabilityBalances: AccountBalance[];
  totalCash: number;
  totalLiabilities: number;
  netFinancialPosition: number;
};

export type ExpenseBreakdownItem = {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
};

export type PeriodReport = {
  startDate: string;
  endDate: string;
  beginningPosition: FinancialPosition;
  endingPosition: FinancialPosition;
  transactions: Transaction[];
  incomeFunding: number;
  borrowedFunds: number;
  cashExpensesPaid: number;
  debtPayments: number;
  debtPrincipalPaid: number;
  interestExpensePaid: number;
  transfersIn: number;
  transfersOut: number;
  totalExpensesIncurred: number;
  expenseBreakdown: ExpenseBreakdownItem[];
  largestExpense: { description: string; amount: number } | null;
  postedExpenseCount: number;
  uncategorizedExpenseTotal: number;
  uncategorizedCount: number;
  netCashChange: number;
  liabilityChange: number;
  netPositionChange: number;
  liabilityBorrowing: number;
  liabilityPurchases: number;
  observations: string[];
};
