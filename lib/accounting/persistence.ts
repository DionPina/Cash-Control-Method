import {
  ASSET_ACCOUNT_TYPES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  LIABILITY_ACCOUNT_TYPES,
} from "./constants.ts";
import { isValidIsoDate } from "./dates.ts";
import type { AccountingData, StudentProfile, Transaction } from "./types.ts";

export const BACKUP_FORMAT = "cash-control-backup";
export const CURRENT_SCHEMA_VERSION = 1;

type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  data: AccountingData;
};

export type DataParseResult =
  | { ok: true; data: AccountingData }
  | { ok: false; error: string };

export function createAccountingBackup(data: AccountingData, exportedAt = new Date().toISOString()): BackupEnvelope {
  return { format: BACKUP_FORMAT, schemaVersion: CURRENT_SCHEMA_VERSION, exportedAt, data };
}

export function parseAccountingBackup(value: unknown): DataParseResult {
  if (isRecord(value) && value.format === BACKUP_FORMAT) {
    if (value.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return { ok: false, error: `This backup uses unsupported schema version ${String(value.schemaVersion)}.` };
    }
    return migrateAndValidate(value.data);
  }
  return migrateAndValidate(value);
}

/** All stored and imported records pass through this explicit migration boundary. */
export function migrateAndValidate(value: unknown): DataParseResult {
  if (!isRecord(value) || value.version !== 1) {
    return { ok: false, error: "The file is not recognized as Cash Control data." };
  }

  const errors: string[] = [];
  const assetAccounts = arrayOrError(value.assetAccounts, "cash accounts", errors);
  const liabilityAccounts = arrayOrError(value.liabilityAccounts, "liability accounts", errors);
  const transactions = arrayOrError(value.transactions, "transactions", errors);
  const mealPlanAccounts = optionalArray(value.mealPlanAccounts, "meal plans", errors);
  const obligations = optionalArray(value.obligations, "required payments", errors);
  const monthlyPlans = optionalArray(value.monthlyPlans, "monthly plans", errors);
  const goals = optionalArray(value.goals, "goals", errors);

  assetAccounts.forEach((item, index) => {
    if (!isRecord(item) || !isText(item.id) || !isText(item.name) ||
      !hasValue(ASSET_ACCOUNT_TYPES, item.type) || !isNonNegative(item.openingBalance) ||
      !isDate(item.openingBalanceDate)) errors.push(`Cash account ${index + 1} is invalid.`);
  });
  liabilityAccounts.forEach((item, index) => {
    if (!isRecord(item) || !isText(item.id) || !isText(item.name) ||
      !hasValue(LIABILITY_ACCOUNT_TYPES, item.type) || !isNonNegative(item.openingBalance) ||
      !isDate(item.openingBalanceDate) || !isOptionalNonNegative(item.interestRate) ||
      !isOptionalNonNegative(item.minimumPayment) || !isOptionalDueDay(item.dueDay)) {
      errors.push(`Liability account ${index + 1} is invalid.`);
    }
  });

  const assetIds = new Set(assetAccounts.filter(isRecord).map((item) => item.id));
  const liabilityIds = new Set(liabilityAccounts.filter(isRecord).map((item) => item.id));
  mealPlanAccounts.forEach((item, index) => {
    if (!isRecord(item) || !isText(item.id) || !isText(item.name) ||
      !["declining-balance", "swipes", "unlimited"].includes(String(item.type)) ||
      !isNonNegative(item.openingBalance) || !isDate(item.openingBalanceDate) ||
      !isOptionalNonNegative(item.semesterCost) || !isOptionalNonNegative(item.swipesRemaining)) errors.push(`Meal plan ${index + 1} is invalid.`);
  });
  const mealPlanIds = new Set(mealPlanAccounts.filter(isRecord).map((item) => item.id));
  transactions.forEach((item, index) => {
    if (!isTransaction(item, assetIds, liabilityIds, mealPlanIds)) errors.push(`Transaction ${index + 1} is invalid.`);
  });
  obligations.forEach((item, index) => {
    if (!isRecord(item) || !isText(item.id) || !isText(item.name) || !isPositive(item.amount) ||
      !isDueDay(item.dueDay) || !hasValue(EXPENSE_CATEGORIES, item.category)) {
      errors.push(`Required payment ${index + 1} is invalid.`);
    }
  });
  monthlyPlans.forEach((item, index) => {
    if (!isRecord(item) || !/^\d{4}-\d{2}$/.test(String(item.month)) ||
      !isNonNegative(item.expectedIncome) || !isRecord(item.categoryBudgets) ||
      !Object.entries(item.categoryBudgets).every(([category, amount]) =>
        hasValue(EXPENSE_CATEGORIES, category) && isNonNegative(amount)) ||
      !(item.categoryBudgetCadences === undefined || (isRecord(item.categoryBudgetCadences) && Object.entries(item.categoryBudgetCadences).every(([category, cadence]) => hasValue(EXPENSE_CATEGORIES, category) && ["daily", "weekly", "monthly", "semester", "one-time"].includes(String(cadence))))) ||
      !isNonNegative(item.plannedDebtPayment) || !isNonNegative(item.plannedSavings) ||
      !isNonNegative(item.safetyBuffer)) errors.push(`Monthly plan ${index + 1} is invalid.`);
  });
  goals.forEach((item, index) => {
    if (!isRecord(item) || !isText(item.id) || !isText(item.name) || !isPositive(item.targetAmount) ||
      !isNonNegative(item.currentAmount) || !isNonNegative(item.monthlyContribution) ||
      !(item.targetDate === undefined || isDate(item.targetDate))) errors.push(`Goal ${index + 1} is invalid.`);
  });
  if (value.profile !== undefined && !isProfile(value.profile)) errors.push("The student profile is invalid.");

  if (errors.length) return { ok: false, error: errors.slice(0, 3).join(" ") };
  const data = value as unknown as AccountingData;
  return {
    ok: true,
    data: {
      ...data,
      profile: data.profile ?? {
        onboardingComplete: data.assetAccounts.length > 0 || data.transactions.length > 0,
        priorities: [],
      },
      obligations: data.obligations ?? [],
      monthlyPlans: data.monthlyPlans ?? [],
      goals: data.goals ?? [],
      mealPlanAccounts: data.mealPlanAccounts ?? [],
    },
  };
}

function isTransaction(value: unknown, assetIds: Set<unknown>, liabilityIds: Set<unknown>, mealPlanIds: Set<unknown>): value is Transaction {
  if (!isRecord(value) || !isText(value.id) || !isDate(value.date) || !isText(value.description) ||
    !isPositive(value.amount) || !["posted", "pending"].includes(String(value.status)) ||
    !isText(value.createdAt) || !(value.note === undefined || typeof value.note === "string")) return false;
  if (value.type === "income") return assetIds.has(value.destinationAssetAccountId) && hasValue(INCOME_CATEGORIES, value.category);
  if (value.type === "expense") {
    const accountExists = value.paymentAccountType === "asset"
      ? assetIds.has(value.paymentAccountId)
      : value.paymentAccountType === "liability" && liabilityIds.has(value.paymentAccountId);
    return accountExists && hasValue(EXPENSE_CATEGORIES, value.category);
  }
  if (value.type === "borrowing") return assetIds.has(value.destinationAssetAccountId) && liabilityIds.has(value.liabilityAccountId);
  if (value.type === "debt-payment") return assetIds.has(value.cashAccountId) && liabilityIds.has(value.liabilityAccountId) &&
    isNonNegative(value.principalAmount) && isNonNegative(value.interestAmount) &&
    Math.abs(Number(value.amount) - Number(value.principalAmount) - Number(value.interestAmount)) <= 0.005;
  if (value.type === "transfer") return assetIds.has(value.sourceAssetAccountId) &&
    assetIds.has(value.destinationAssetAccountId) && value.sourceAssetAccountId !== value.destinationAssetAccountId;
  if (value.type === "meal-plan-funding") return mealPlanIds.has(value.mealPlanAccountId) &&
    (value.paymentAccountType === "asset" ? assetIds.has(value.paymentAccountId) : value.paymentAccountType === "liability" && liabilityIds.has(value.paymentAccountId));
  if (value.type === "meal-plan-use") return mealPlanIds.has(value.mealPlanAccountId) && ["groceries", "dining-out"].includes(String(value.category));
  return false;
}

function isProfile(value: unknown): value is StudentProfile {
  if (!isRecord(value) || typeof value.onboardingComplete !== "boolean" || !Array.isArray(value.priorities)) return false;
  const priorities = new Set(["make-money-last", "stay-ahead-of-bills", "understand-spending", "control-spending", "build-savings", "reduce-debt"]);
  return value.priorities.every((item) => priorities.has(String(item))) &&
    (value.firstName === undefined || typeof value.firstName === "string") &&
    (value.expectedIncomeSource === undefined || typeof value.expectedIncomeSource === "string") &&
    (value.nextIncomeDate === undefined || isDate(value.nextIncomeDate)) &&
    (value.nextIncomeAmount === undefined || isNonNegative(value.nextIncomeAmount)) &&
    (value.housingSituation === undefined || ["dorm", "off-campus", "with-family", "other"].includes(String(value.housingSituation)));
}

function arrayOrError(value: unknown, label: string, errors: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  errors.push(`The ${label} list is missing.`);
  return [];
}
function optionalArray(value: unknown, label: string, errors: string[]): unknown[] {
  return value === undefined ? [] : arrayOrError(value, label, errors);
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function isText(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function isDate(value: unknown): value is string { return typeof value === "string" && isValidIsoDate(value); }
function isNonNegative(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0; }
function isPositive(value: unknown): value is number { return isNonNegative(value) && value > 0; }
function isOptionalNonNegative(value: unknown): boolean { return value === undefined || isNonNegative(value); }
function isDueDay(value: unknown): value is number { return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 31; }
function isOptionalDueDay(value: unknown): boolean { return value === undefined || isDueDay(value); }
function hasValue(options: Array<{ value: string }>, value: unknown): value is string {
  return typeof value === "string" && options.some((option) => option.value === value);
}
