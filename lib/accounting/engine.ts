import type {
  AccountingData,
  AssetAccount,
  FinancialPosition,
  LiabilityAccount,
  Transaction,
} from "./types.ts";

type Boundary = {
  date: string;
  includeDate: boolean;
};

function transactionIsIncluded(transaction: Transaction, boundary: Boundary): boolean {
  if (transaction.status !== "posted") return false;
  return boundary.includeDate
    ? transaction.date <= boundary.date
    : transaction.date < boundary.date;
}

function accountIsOpen(openingDate: string, boundary: Boundary): boolean {
  return openingDate <= boundary.date;
}

export function transactionReferencesAsset(
  transaction: Transaction,
  accountId: string,
): boolean {
  switch (transaction.type) {
    case "income":
      return transaction.destinationAssetAccountId === accountId;
    case "expense":
      return transaction.paymentAccountType === "asset" && transaction.paymentAccountId === accountId;
    case "borrowing":
      return transaction.destinationAssetAccountId === accountId;
    case "debt-payment":
      return transaction.cashAccountId === accountId;
    case "transfer":
      return (
        transaction.sourceAssetAccountId === accountId ||
        transaction.destinationAssetAccountId === accountId
      );
  }
}

export function transactionReferencesLiability(
  transaction: Transaction,
  accountId: string,
): boolean {
  switch (transaction.type) {
    case "expense":
      return transaction.paymentAccountType === "liability" && transaction.paymentAccountId === accountId;
    case "borrowing":
    case "debt-payment":
      return transaction.liabilityAccountId === accountId;
    default:
      return false;
  }
}

export function calculateAssetBalance(
  account: AssetAccount,
  transactions: Transaction[],
  boundary: Boundary,
  excludedTransactionId?: string,
): number {
  if (!accountIsOpen(account.openingBalanceDate, boundary)) return 0;

  return transactions.reduce((balance, transaction) => {
    if (
      transaction.id === excludedTransactionId ||
      !transactionIsIncluded(transaction, boundary)
    ) {
      return balance;
    }

    switch (transaction.type) {
      case "income":
        return transaction.destinationAssetAccountId === account.id
          ? balance + transaction.amount
          : balance;
      case "expense":
        return transaction.paymentAccountType === "asset" &&
          transaction.paymentAccountId === account.id
          ? balance - transaction.amount
          : balance;
      case "borrowing":
        return transaction.destinationAssetAccountId === account.id
          ? balance + transaction.amount
          : balance;
      case "debt-payment":
        return transaction.cashAccountId === account.id
          ? balance - transaction.amount
          : balance;
      case "transfer":
        if (transaction.sourceAssetAccountId === account.id) {
          return balance - transaction.amount;
        }
        if (transaction.destinationAssetAccountId === account.id) {
          return balance + transaction.amount;
        }
        return balance;
    }
  }, account.openingBalance);
}

export function calculateLiabilityBalance(
  account: LiabilityAccount,
  transactions: Transaction[],
  boundary: Boundary,
  excludedTransactionId?: string,
): number {
  if (!accountIsOpen(account.openingBalanceDate, boundary)) return 0;

  return transactions.reduce((balance, transaction) => {
    if (
      transaction.id === excludedTransactionId ||
      !transactionIsIncluded(transaction, boundary)
    ) {
      return balance;
    }

    switch (transaction.type) {
      case "expense":
        return transaction.paymentAccountType === "liability" &&
          transaction.paymentAccountId === account.id
          ? balance + transaction.amount
          : balance;
      case "borrowing":
        return transaction.liabilityAccountId === account.id
          ? balance + transaction.amount
          : balance;
      case "debt-payment":
        return transaction.liabilityAccountId === account.id
          ? balance - transaction.principalAmount
          : balance;
      default:
        return balance;
    }
  }, account.openingBalance);
}

export function calculateFinancialPosition(
  data: AccountingData,
  boundary: Boundary,
): FinancialPosition {
  const assetBalances = data.assetAccounts
    .filter((account) => account.openingBalanceDate <= boundary.date)
    .map((account) => ({
      id: account.id,
      name: account.name,
      balance: calculateAssetBalance(account, data.transactions, boundary),
    }));
  const liabilityBalances = data.liabilityAccounts
    .filter((account) => account.openingBalanceDate <= boundary.date)
    .map((account) => ({
      id: account.id,
      name: account.name,
      balance: calculateLiabilityBalance(account, data.transactions, boundary),
    }));
  const totalCash = assetBalances.reduce((sum, account) => sum + account.balance, 0);
  const totalLiabilities = liabilityBalances.reduce(
    (sum, account) => sum + account.balance,
    0,
  );

  return {
    assetBalances,
    liabilityBalances,
    totalCash,
    totalLiabilities,
    netFinancialPosition: totalCash - totalLiabilities,
  };
}

export function currentFinancialPosition(data: AccountingData, today: string): FinancialPosition {
  return calculateFinancialPosition(data, { date: today, includeDate: true });
}

export function accountNameForTransaction(
  transaction: Transaction,
  data: AccountingData,
): string {
  const assetName = (id: string) =>
    data.assetAccounts.find((account) => account.id === id)?.name ?? "Missing account";
  const liabilityName = (id: string) =>
    data.liabilityAccounts.find((account) => account.id === id)?.name ?? "Missing account";

  switch (transaction.type) {
    case "income":
      return assetName(transaction.destinationAssetAccountId);
    case "expense":
      return transaction.paymentAccountType === "asset"
        ? assetName(transaction.paymentAccountId)
        : liabilityName(transaction.paymentAccountId);
    case "borrowing":
      return `${liabilityName(transaction.liabilityAccountId)} → ${assetName(transaction.destinationAssetAccountId)}`;
    case "debt-payment":
      return `${assetName(transaction.cashAccountId)} → ${liabilityName(transaction.liabilityAccountId)}`;
    case "transfer":
      return `${assetName(transaction.sourceAssetAccountId)} → ${assetName(transaction.destinationAssetAccountId)}`;
  }
}

export function sortTransactionsNewestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const dateComparison = b.date.localeCompare(a.date);
    return dateComparison || b.createdAt.localeCompare(a.createdAt);
  });
}
