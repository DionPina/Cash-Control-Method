"use client";

import { useCallback, useEffect, useState } from "react";

import { STORAGE_KEY } from "@/lib/accounting/constants";
import type {
  AccountingData,
  AssetAccount,
  LiabilityAccount,
  MonthlyPlan,
  Obligation,
  SavingsGoal,
  StudentProfile,
  Transaction,
} from "@/lib/accounting/types";

const EMPTY_DATA: AccountingData = {
  version: 1,
  assetAccounts: [],
  liabilityAccounts: [],
  transactions: [],
  profile: { onboardingComplete: false, priorities: [] },
  obligations: [],
  monthlyPlans: [],
  goals: [],
};

function normalizeData(value: AccountingData): AccountingData {
  return {
    ...value,
    profile:
      value.profile ??
      ({
        onboardingComplete:
          value.assetAccounts.length > 0 || value.transactions.length > 0,
        priorities: [],
      } satisfies StudentProfile),
    obligations: value.obligations ?? [],
    monthlyPlans: value.monthlyPlans ?? [],
    goals: value.goals ?? [],
  };
}

function isStoredData(value: unknown): value is AccountingData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AccountingData>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.assetAccounts) &&
    Array.isArray(candidate.liabilityAccounts) &&
    Array.isArray(candidate.transactions)
  );
}

export function useAccountingStore() {
  const [data, setData] = useState<AccountingData>(EMPTY_DATA);
  const [hydrated, setHydrated] = useState(false);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isStoredData(parsed)) {
          setData(normalizeData(parsed));
        } else {
          setStorageMessage(
            "Saved Cash Control data could not be recognized. No stored records were changed.",
          );
        }
      }
    } catch {
      setStorageMessage(
        "Cash Control could not read saved data from this browser. You can still use the app for this session.",
      );
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      setStorageMessage(
        "Your latest change could not be saved in this browser. Keep this tab open while you review your records.",
      );
    }
  }, [data, hydrated]);

  const upsertAssetAccount = useCallback((account: AssetAccount) => {
    setData((current) => ({
      ...current,
      assetAccounts: current.assetAccounts.some((item) => item.id === account.id)
        ? current.assetAccounts.map((item) => (item.id === account.id ? account : item))
        : [...current.assetAccounts, account],
    }));
  }, []);

  const upsertLiabilityAccount = useCallback((account: LiabilityAccount) => {
    setData((current) => ({
      ...current,
      liabilityAccounts: current.liabilityAccounts.some((item) => item.id === account.id)
        ? current.liabilityAccounts.map((item) =>
            item.id === account.id ? account : item,
          )
        : [...current.liabilityAccounts, account],
    }));
  }, []);

  const upsertTransaction = useCallback((transaction: Transaction) => {
    setData((current) => ({
      ...current,
      transactions: current.transactions.some((item) => item.id === transaction.id)
        ? current.transactions.map((item) =>
            item.id === transaction.id ? transaction : item,
          )
        : [...current.transactions, transaction],
    }));
  }, []);

  const deleteAssetAccount = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      assetAccounts: current.assetAccounts.filter((account) => account.id !== id),
    }));
  }, []);

  const deleteLiabilityAccount = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      liabilityAccounts: current.liabilityAccounts.filter((account) => account.id !== id),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      transactions: current.transactions.filter((transaction) => transaction.id !== id),
    }));
  }, []);

  const replaceAllData = useCallback((nextData: AccountingData) => {
    setData(normalizeData(nextData));
  }, []);

  const saveProfile = useCallback((profile: StudentProfile) => {
    setData((current) => ({ ...current, profile }));
  }, []);

  const saveMonthlyPlan = useCallback((plan: MonthlyPlan) => {
    setData((current) => ({
      ...current,
      monthlyPlans: [
        ...(current.monthlyPlans ?? []).filter((item) => item.month !== plan.month),
        plan,
      ],
    }));
  }, []);

  const upsertObligation = useCallback((obligation: Obligation) => {
    setData((current) => ({
      ...current,
      obligations: (current.obligations ?? []).some((item) => item.id === obligation.id)
        ? (current.obligations ?? []).map((item) =>
            item.id === obligation.id ? obligation : item,
          )
        : [...(current.obligations ?? []), obligation],
    }));
  }, []);

  const deleteObligation = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      obligations: (current.obligations ?? []).filter((item) => item.id !== id),
    }));
  }, []);

  const upsertGoal = useCallback((goal: SavingsGoal) => {
    setData((current) => ({
      ...current,
      goals: (current.goals ?? []).some((item) => item.id === goal.id)
        ? (current.goals ?? []).map((item) => (item.id === goal.id ? goal : item))
        : [...(current.goals ?? []), goal],
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      goals: (current.goals ?? []).filter((item) => item.id !== id),
    }));
  }, []);

  const clearAllData = useCallback(() => {
    setData(EMPTY_DATA);
    setStorageMessage(null);
  }, []);

  return {
    data,
    hydrated,
    storageMessage,
    dismissStorageMessage: () => setStorageMessage(null),
    upsertAssetAccount,
    upsertLiabilityAccount,
    upsertTransaction,
    deleteAssetAccount,
    deleteLiabilityAccount,
    deleteTransaction,
    replaceAllData,
    clearAllData,
    saveProfile,
    saveMonthlyPlan,
    upsertObligation,
    deleteObligation,
    upsertGoal,
    deleteGoal,
  };
}
