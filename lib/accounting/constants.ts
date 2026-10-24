import type {
  AssetAccountType,
  ExpenseCategory,
  IncomeCategory,
  LiabilityAccountType,
  TransactionType,
} from "./types.ts";

export const STORAGE_KEY = "cash-control-accounting:v1";

export const ASSET_ACCOUNT_TYPES: Array<{ value: AssetAccountType; label: string }> = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "cash", label: "Cash" },
  { value: "other-cash", label: "Other cash account" },
];

export const LIABILITY_ACCOUNT_TYPES: Array<{
  value: LiabilityAccountType;
  label: string;
}> = [
  { value: "credit-card", label: "Credit card" },
  { value: "student-loan", label: "Student loan" },
  { value: "auto-loan", label: "Auto loan" },
  { value: "personal-loan", label: "Personal loan" },
  { value: "buy-now-pay-later", label: "Buy now, pay later" },
  { value: "family-friends", label: "Amount owed to family or friends" },
  { value: "unpaid-bill", label: "Unpaid bill" },
  { value: "other-liability", label: "Other liability" },
];

export const INCOME_CATEGORIES: Array<{ value: IncomeCategory; label: string }> = [
  { value: "wages-salary", label: "Wages or salary" },
  { value: "tips", label: "Tips" },
  { value: "gig-work", label: "Gig work" },
  { value: "internship-income", label: "Internship income" },
  { value: "scholarship", label: "Scholarship" },
  { value: "grant", label: "Grant" },
  { value: "family-support", label: "Family support" },
  { value: "gift", label: "Gift" },
  { value: "refund", label: "Refund" },
  { value: "other-non-borrowed", label: "Other non-borrowed funding" },
];

export const EXPENSE_CATEGORIES: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "rent-housing", label: "Rent and housing" },
  { value: "utilities", label: "Utilities" },
  { value: "phone-internet", label: "Phone and internet" },
  { value: "insurance", label: "Insurance" },
  { value: "groceries", label: "Groceries" },
  { value: "dining-out", label: "Dining out" },
  { value: "gas-transportation", label: "Gas and transportation" },
  { value: "tuition-fees", label: "Tuition and fees" },
  { value: "textbooks-school-supplies", label: "Textbooks and school supplies" },
  { value: "medical-healthcare", label: "Medical and healthcare" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping-clothing", label: "Shopping and clothing" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "interest", label: "Interest" },
  { value: "bank-financial-fees", label: "Bank or financial fees" },
  { value: "other-expense", label: "Other expense" },
  { value: "uncategorized", label: "Uncategorized" },
];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Income or funding",
  expense: "Expense",
  borrowing: "Borrowing",
  "debt-payment": "Debt payment",
  transfer: "Transfer",
  "meal-plan-funding": "Add to meal plan",
  "meal-plan-use": "Meal-plan purchase",
};

export const RECORD_CHOICES: Array<{
  value: TransactionType;
  label: string;
  helper: string;
}> = [
  { value: "income", label: "I received money", helper: "Income or non-borrowed funding" },
  { value: "expense", label: "I spent money", helper: "Cash or credit purchase" },
  { value: "borrowing", label: "I borrowed money", helper: "Loan proceeds received" },
  { value: "debt-payment", label: "I paid debt", helper: "Principal and optional interest" },
  { value: "transfer", label: "I moved money", helper: "Between your cash accounts" },
  { value: "meal-plan-funding", label: "I funded a meal plan", helper: "Move cash or credit into restricted food value" },
  { value: "meal-plan-use", label: "I used a meal plan", helper: "Record food without reducing cash again" },
];

export function getLabel<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
