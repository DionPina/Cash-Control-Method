"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { STORAGE_KEY } from "@/lib/accounting/constants";
import { migrateAndValidate } from "@/lib/accounting/persistence";
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

export function useAccountingStore() {
  const [data, setData] = useState<AccountingData>(EMPTY_DATA);
  const [hydrated, setHydrated] = useState(false);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const persistenceReady = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        const result = migrateAndValidate(parsed);
        if (result.ok) {
          setData(result.data);
          persistenceReady.current = true;
        } else {
          setStorageMessage(
            `Saved Cash Control data could not be used. ${result.error} The stored records were left unchanged.`,
          );
        }
      } else {
        persistenceReady.current = true;
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
    if (!hydrated || !persistenceReady.current) return;
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
    const result = migrateAndValidate(nextData);
    if (!result.ok) {
      setStorageMessage(`Cash Control could not use that data. ${result.error}`);
      return;
    }
    persistenceReady.current = true;
    setData(result.data);
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
    persistenceReady.current = true;
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
