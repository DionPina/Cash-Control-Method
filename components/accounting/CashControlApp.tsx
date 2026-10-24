"use client";

import { useEffect, useRef, useState } from "react";

import { useAccountingStore } from "@/hooks/useAccountingStore";
import { createSampleData } from "@/lib/accounting/sampleData";
import { createAccountingBackup, parseAccountingBackup } from "@/lib/accounting/persistence";
import type { Transaction } from "@/lib/accounting/types";

import AccountsPanel from "./AccountsPanel";
import Dashboard from "./Dashboard";
import OnboardingFlow from "./OnboardingFlow";
import PlanPanel from "./PlanPanel";
import ReportsPanel from "./ReportsPanel";
import TransactionForm from "./TransactionForm";
import TransactionLedger from "./TransactionLedger";
import { DangerButton, PrimaryButton, SecondaryButton } from "./ui";

type AppArea = "home" | "record" | "plan" | "activity" | "reviews" | "accounts";

const areas: Array<{ id: AppArea; label: string; helper: string }> = [
  { id: "home", label: "Today", helper: "What matters now" },
  { id: "record", label: "Record", helper: "Add what happened" },
  { id: "plan", label: "Plan", helper: "What money must cover" },
  { id: "reviews", label: "Review", helper: "Daily, weekly, monthly" },
];
const LAST_BACKUP_KEY = "cash-control-last-backup-at";

export default function CashControlApp() {
  const store = useAccountingStore();
  const [activeArea, setActiveArea] = useState<AppArea>("home");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastBackupAt(window.localStorage.getItem(LAST_BACKUP_KEY));
  }, []);

  if (!store.hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-600">
        Loading your Cash Control records…
      </div>
    );
  }

  const navigate = (area: AppArea) => {
    if (area !== "record") setEditingTransaction(null);
    setActiveArea(area);
  };

  const loadSampleData = () => {
    const hasData =
      store.data.assetAccounts.length > 0 ||
      store.data.liabilityAccounts.length > 0 ||
      (store.data.mealPlanAccounts ?? []).length > 0 ||
      store.data.transactions.length > 0;
    if (
      !hasData ||
      window.confirm(
        "Loading sample data will replace the accounts and transactions currently saved in this browser. Continue?",
      )
    ) {
      store.replaceAllData(createSampleData());
      setEditingTransaction(null);
      setActiveArea("home");
    }
  };

  const clearAllData = () => {
    if (
      window.confirm(
        "Clear every Cash Control account and transaction saved in this browser? This cannot be undone.",
      )
    ) {
      store.clearAllData();
      setEditingTransaction(null);
      setActiveArea("home");
    }
  };

  const exportBackup = () => {
    const backup = createAccountingBackup(store.data);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cash-control-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    const exportedAt = new Date().toISOString();
    window.localStorage.setItem(LAST_BACKUP_KEY, exportedAt);
    setLastBackupAt(exportedAt);
    setBackupMessage("Backup exported. Keep the JSON file somewhere you trust; it is the copy you can move to another device.");
  };

  const startPersonalRecords = () => {
    if (!window.confirm("Leave sample data and start your own records? The sample will be removed from this browser.")) return;
    store.clearAllData();
    setEditingTransaction(null);
    setActiveArea("home");
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    if (file.size > 5_000_000) {
      setBackupMessage("That backup is larger than 5 MB and was not opened.");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const result = parseAccountingBackup(parsed);
      if (!result.ok) {
        setBackupMessage(`Import stopped: ${result.error}`);
        return;
      }
      if (!window.confirm("Import this backup and replace the records currently saved in this browser?")) return;
      store.replaceAllData(result.data);
      setEditingTransaction(null);
      setActiveArea("home");
      setBackupMessage("Backup imported successfully.");
    } catch {
      setBackupMessage("Import stopped: the selected file is not valid JSON.");
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };

  if (!store.data.profile?.onboardingComplete) {
    return (
      <OnboardingFlow
        onComplete={(data) => {
          store.replaceAllData(data);
          setActiveArea("home");
        }}
        onLoadSample={loadSampleData}
      />
    );
  }

  return (
    <section className="bg-[#f5f7fa] pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 md:pt-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sky-700">Cash Control</p>
              <h2 className="mt-1 text-lg font-semibold text-[#020b24]">Your money, one clear next step.</h2>
            </div>
            <PrimaryButton type="button" className="shrink-0" onClick={() => navigate("record")}>+ Record</PrimaryButton>
          </div>

          <nav className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 md:grid-cols-4" aria-label="Cash Control application">
            {areas.map((area) => (
              <button key={area.id} type="button" aria-current={activeArea === area.id ? "page" : undefined} onClick={() => navigate(area.id)} className={`rounded-xl px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${activeArea === area.id ? "bg-[#020b24] text-white" : "bg-slate-50 text-[#020b24] hover:bg-sky-50"}`}>
                <span className="block text-sm font-semibold">{area.label}</span>
                <span className={`mt-0.5 hidden text-xs sm:block ${activeArea === area.id ? "text-slate-300" : "text-slate-500"}`}>{area.helper}</span>
              </button>
            ))}
          </nav>

          <details className="mt-3 border-t border-slate-100 pt-3">
            <summary className="cursor-pointer px-2 text-sm font-medium text-slate-600">Settings & data</summary>
            <div className="mt-3 flex flex-wrap gap-2 px-2 pb-1">
              <SecondaryButton type="button" onClick={() => setActiveArea("accounts")}>Accounts and meal plans</SecondaryButton>
              <SecondaryButton type="button" onClick={() => setActiveArea("activity")}>Full transaction ledger</SecondaryButton>
              <SecondaryButton type="button" onClick={exportBackup}>Export backup</SecondaryButton>
              <SecondaryButton type="button" onClick={() => importInput.current?.click()}>Import backup</SecondaryButton>
              <SecondaryButton type="button" onClick={loadSampleData}>Load sample data</SecondaryButton>
              <input
                ref={importInput}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Choose a Cash Control JSON backup"
                onChange={(event) => void importBackup(event.target.files?.[0])}
              />
              <DangerButton type="button" className="sm:ml-auto" onClick={clearAllData}>Clear all data</DangerButton>
            </div>
          </details>
        </div>

        {store.data.profile?.isSampleData && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold text-violet-950">Sample data — explore freely</p><p className="mt-0.5 text-xs text-violet-800">Nothing here is your personal financial record.</p></div>
            <SecondaryButton type="button" onClick={startPersonalRecords}>Start my personal records</SecondaryButton>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold text-[#020b24]">Saved only in this browser</p><p className="mt-0.5 text-xs leading-5 text-slate-600">Records do not automatically follow you to another device and may be lost if browser data is cleared. {lastBackupAt ? `Last backup exported ${formatBackupTime(lastBackupAt)}.` : "No backup has been exported from this browser yet."}</p></div>
          <SecondaryButton type="button" className="shrink-0" onClick={exportBackup}>Export backup</SecondaryButton>
        </div>

        {store.storageMessage && (
          <div role="alert" className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>{store.storageMessage}</p>
            <button type="button" onClick={store.dismissStorageMessage} className="font-semibold underline underline-offset-4">Dismiss</button>
          </div>
        )}

        {backupMessage && (
          <div role="status" className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700">
            <p>{backupMessage}</p>
            <button type="button" onClick={() => setBackupMessage(null)} className="font-semibold text-sky-900">Dismiss</button>
          </div>
        )}

        <div className="mt-8">
          {activeArea === "home" && (
            <Dashboard
              data={store.data}
              onNavigate={(area) => navigate(area)}
            />
          )}
          {activeArea === "record" && (
            <TransactionForm
              key={editingTransaction?.id ?? "new-transaction"}
              data={store.data}
              editingTransaction={editingTransaction}
              onSave={(transaction) => {
                store.upsertTransaction(transaction);
                if (editingTransaction) {
                  setEditingTransaction(null);
                  setActiveArea("activity");
                }
              }}
              onCancelEdit={() => {
                setEditingTransaction(null);
                setActiveArea("activity");
              }}
              onCreateAccount={() => setActiveArea("accounts")}
            />
          )}
          {activeArea === "plan" && (
            <PlanPanel
              data={store.data}
              onSavePlan={store.saveMonthlyPlan}
              onSaveObligation={store.upsertObligation}
              onDeleteObligation={store.deleteObligation}
              onSaveGoal={store.upsertGoal}
              onDeleteGoal={store.deleteGoal}
              onSaveProfile={store.saveProfile}
            />
          )}
          {activeArea === "activity" && (
            <TransactionLedger
              data={store.data}
              onEdit={(transaction) => {
                setEditingTransaction(transaction);
                setActiveArea("record");
              }}
              onDelete={store.deleteTransaction}
              onRecord={() => setActiveArea("record")}
            />
          )}
          {activeArea === "accounts" && (
            <AccountsPanel
              data={store.data}
              onSaveAsset={store.upsertAssetAccount}
              onSaveLiability={store.upsertLiabilityAccount}
              onDeleteAsset={store.deleteAssetAccount}
              onDeleteLiability={store.deleteLiabilityAccount}
              onSaveMealPlan={store.upsertMealPlanAccount}
              onDeleteMealPlan={store.deleteMealPlanAccount}
            />
          )}
          {activeArea === "reviews" && <ReportsPanel data={store.data} />}
        </div>
      </div>
    </section>
  );
}

function formatBackupTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "previously";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
