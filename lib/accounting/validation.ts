import {
  calculateLiabilityBalance,
  calculateMealPlanBalance,
  transactionReferencesAsset,
  transactionReferencesLiability,
} from "./engine.ts";
import { isValidIsoDate } from "./dates.ts";
import type {
  AccountingData,
  AssetAccount,
  LiabilityAccount,
  Transaction,
} from "./types.ts";

function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isValidNonNegativeAmount(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function validateAssetAccount(
  account: AssetAccount,
  transactions: Transaction[] = [],
): string[] {
  const errors: string[] = [];
  if (!account.name.trim()) errors.push("Enter an account name.");
  if (!isValidNonNegativeAmount(account.openingBalance)) {
    errors.push("Opening balance must be zero or a positive number.");
  }
  if (!isValidIsoDate(account.openingBalanceDate)) {
    errors.push("Enter a valid opening balance date.");
  }
  if (
    transactions.some(
      (transaction) =>
        transaction.date < account.openingBalanceDate &&
        transactionReferencesAsset(transaction, account.id),
    )
  ) {
    errors.push(
      "Opening balance date cannot be after a transaction assigned to this account.",
    );
  }
  return errors;
}

export function validateLiabilityAccount(
  account: LiabilityAccount,
  transactions: Transaction[] = [],
): string[] {
  const errors: string[] = [];
  if (!account.name.trim()) errors.push("Enter a liability name.");
  if (!isValidNonNegativeAmount(account.openingBalance)) {
    errors.push("Opening balance owed must be zero or a positive number.");
  }
  if (!isValidIsoDate(account.openingBalanceDate)) {
    errors.push("Enter a valid opening balance date.");
  }
  if (
    account.interestRate !== undefined &&
    !isValidNonNegativeAmount(account.interestRate)
  ) {
    errors.push("Interest rate must be zero or a positive number.");
  }
  if (
    account.minimumPayment !== undefined &&
    !isValidNonNegativeAmount(account.minimumPayment)
  ) {
    errors.push("Minimum payment must be zero or a positive number.");
  }
  if (
    account.dueDay !== undefined &&
    (!Number.isInteger(account.dueDay) || account.dueDay < 1 || account.dueDay > 31)
  ) {
    errors.push("Due day must be a whole number from 1 through 31.");
  }
  if (
    transactions.some(
      (transaction) =>
        transaction.date < account.openingBalanceDate &&
        transactionReferencesLiability(transaction, account.id),
    )
  ) {
    errors.push(
      "Opening balance date cannot be after a transaction assigned to this liability.",
    );
  }
  return errors;
}

function assetAccount(data: AccountingData, id: string): AssetAccount | undefined {
  return data.assetAccounts.find((account) => account.id === id);
}

function liabilityAccount(
  data: AccountingData,
  id: string,
): LiabilityAccount | undefined {
  return data.liabilityAccounts.find((account) => account.id === id);
}

function mealPlanAccount(data: AccountingData, id: string) {
  return data.mealPlanAccounts?.find((account) => account.id === id);
}

function validateAccountDate(
  errors: string[],
  transactionDate: string,
  account: AssetAccount | LiabilityAccount | undefined,
): void {
  if (account && transactionDate < account.openingBalanceDate) {
    errors.push(
      `The transaction date cannot be before ${account.name}'s opening balance date.`,
    );
  }
}

export function validateTransaction(
  transaction: Transaction,
  data: AccountingData,
): string[] {
  const errors: string[] = [];
  if (!transaction.description.trim()) errors.push("Enter a description.");
  if (!isValidIsoDate(transaction.date)) errors.push("Enter a valid transaction date.");
  if (!isValidAmount(transaction.amount)) {
    errors.push("Amount must be greater than zero.");
  }

  switch (transaction.type) {
    case "income": {
      const destination = assetAccount(data, transaction.destinationAssetAccountId);
      if (!destination) errors.push("Select a valid destination cash account.");
      if (!transaction.category) errors.push("Select an income or funding category.");
      validateAccountDate(errors, transaction.date, destination);
      break;
    }
    case "expense": {
      const paymentAccount =
        transaction.paymentAccountType === "asset"
          ? assetAccount(data, transaction.paymentAccountId)
          : liabilityAccount(data, transaction.paymentAccountId);
      if (!paymentAccount) errors.push("Select a valid payment account.");
      if (!transaction.category) errors.push("Select an expense category.");
      validateAccountDate(errors, transaction.date, paymentAccount);
      break;
    }
    case "borrowing": {
      const destination = assetAccount(data, transaction.destinationAssetAccountId);
      const liability = liabilityAccount(data, transaction.liabilityAccountId);
      if (!destination) errors.push("Select a valid destination cash account.");
      if (!liability) errors.push("Select a valid liability account.");
      validateAccountDate(errors, transaction.date, destination);
      validateAccountDate(errors, transaction.date, liability);
      break;
    }
    case "debt-payment": {
      const cash = assetAccount(data, transaction.cashAccountId);
      const liability = liabilityAccount(data, transaction.liabilityAccountId);
      if (!cash) errors.push("Select a valid cash account for the payment.");
      if (!liability) errors.push("Select a valid liability account to pay.");
      if (!isValidNonNegativeAmount(transaction.principalAmount)) {
        errors.push("Principal must be zero or a positive number.");
      }
      if (!isValidNonNegativeAmount(transaction.interestAmount)) {
        errors.push("Interest must be zero or a positive number.");
      }
      if (transaction.principalAmount + transaction.interestAmount <= 0) {
        errors.push("Enter a principal or interest amount greater than zero.");
      }
      if (
        Math.abs(
          transaction.amount -
            (transaction.principalAmount + transaction.interestAmount),
        ) > 0.005
      ) {
        errors.push("Total payment must equal principal plus interest.");
      }
      validateAccountDate(errors, transaction.date, cash);
      validateAccountDate(errors, transaction.date, liability);
      if (liability && transaction.status === "posted") {
        const availableBalance = calculateLiabilityBalance(
          liability,
          data.transactions,
          { date: transaction.date, includeDate: true },
          transaction.id,
        );
        if (transaction.principalAmount > availableBalance + 0.005) {
          errors.push(
            `Principal cannot exceed the ${availableBalance.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })} posted balance owed.`,
          );
        }
      }
      break;
    }
    case "transfer": {
      const source = assetAccount(data, transaction.sourceAssetAccountId);
      const destination = assetAccount(data, transaction.destinationAssetAccountId);
      if (!source) errors.push("Select a valid source cash account.");
      if (!destination) errors.push("Select a valid destination cash account.");
      if (
        transaction.sourceAssetAccountId &&
        transaction.sourceAssetAccountId === transaction.destinationAssetAccountId
      ) {
        errors.push("Source and destination accounts must be different.");
      }
      validateAccountDate(errors, transaction.date, source);
      validateAccountDate(errors, transaction.date, destination);
      break;
    }
    case "meal-plan-funding": {
      const source = transaction.paymentAccountType === "asset"
        ? assetAccount(data, transaction.paymentAccountId)
        : liabilityAccount(data, transaction.paymentAccountId);
      const mealPlan = mealPlanAccount(data, transaction.mealPlanAccountId);
      if (!source) errors.push("Select a valid account used to fund the meal plan.");
      if (!mealPlan) errors.push("Select a valid meal plan.");
      validateAccountDate(errors, transaction.date, source);
      if (mealPlan && transaction.date < mealPlan.openingBalanceDate) errors.push(`The transaction date cannot be before ${mealPlan.name}'s opening balance date.`);
      break;
    }
    case "meal-plan-use": {
      const mealPlan = mealPlanAccount(data, transaction.mealPlanAccountId);
      if (!mealPlan) errors.push("Select a valid meal plan.");
      if (!['groceries', 'dining-out'].includes(transaction.category)) errors.push("Choose groceries or dining out for meal-plan use.");
      if (mealPlan && transaction.status === "posted") {
        const balance = calculateMealPlanBalance(mealPlan, data.transactions, { date: transaction.date, includeDate: true }, transaction.id);
        if (transaction.amount > balance + 0.005) errors.push(`Meal-plan use cannot exceed the ${balance.toLocaleString("en-US", { style: "currency", currency: "USD" })} restricted balance.`);
      }
      break;
    }
  }

  return [...new Set(errors)];
}

export function assetAccountHasTransactions(
  accountId: string,
  transactions: Transaction[],
): boolean {
  return transactions.some((transaction) =>
    transactionReferencesAsset(transaction, accountId),
  );
}

export function liabilityAccountHasTransactions(
  accountId: string,
  transactions: Transaction[],
): boolean {
  return transactions.some((transaction) =>
    transactionReferencesLiability(transaction, accountId),
  );
}
