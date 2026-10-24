"use client";

import { useState } from "react";

import { useAccountingStore } from "@/hooks/useAccountingStore";
import { createSampleData } from "@/lib/accounting/sampleData";
import type { Transaction } from "@/lib/accounting/types";

import AccountsPanel from "./AccountsPanel";
import Dashboard from "./Dashboard";
import OnboardingFlow from "./OnboardingFlow";
import PlanPanel from "./PlanPanel";
import ReportsPanel from "./ReportsPanel";
import TransactionForm from "./TransactionForm";
import TransactionLedger from "./TransactionLedger";
import { DangerButton, SecondaryButton } from "./ui";

type AppArea = "home" | "record" | "plan" | "activity" | "reviews" | "accounts";

const areas: Array<{ id: AppArea; label: string; helper: string }> = [
  { id: "home", label: "Home", helper: "What matters now" },
  { id: "record", label: "Record", helper: "What happened" },
  { id: "plan", label: "Plan", helper: "Give money a purpose" },
  { id: "activity", label: "Activity", helper: "Review your records" },
  { id: "reviews", label: "Reviews", helper: "Weekly and monthly" },
];

export default function CashControlApp() {
  const store = useAccountingStore();
  const [activeArea, setActiveArea] = useState<AppArea>("home");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sky-700">Your Cash Control</p>
              <h2 className="mt-1 text-xl font-semibold text-[#020b24]">
                A clear plan built from what actually happened.
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Record once. Your plan, weekly check-in, and monthly review update together.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SecondaryButton type="button" onClick={loadSampleData}>
                Load sample data
              </SecondaryButton>
              <SecondaryButton type="button" onClick={() => setActiveArea("accounts")}>
                Accounts & setup
              </SecondaryButton>
              <DangerButton type="button" onClick={clearAllData}>
                Clear all data
              </DangerButton>
            </div>
          </div>

          <nav className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Cash Control application">
            {areas.map((area) => (
              <button
                key={area.id}
                type="button"
                aria-current={activeArea === area.id ? "page" : undefined}
                onClick={() => navigate(area.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  activeArea === area.id
                    ? "border-[#020b24] bg-[#020b24] text-white"
                    : "border-slate-200 bg-slate-50 text-[#020b24] hover:border-[#decfb0] hover:bg-[#fdfaf4]"
                }`}
              >
                <span className="block text-sm font-semibold">{area.label}</span>
                <span className={`mt-0.5 block text-xs ${activeArea === area.id ? "text-slate-300" : "text-slate-500"}`}>
                  {area.helper}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {store.storageMessage && (
          <div role="alert" className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>{store.storageMessage}</p>
            <button type="button" onClick={store.dismissStorageMessage} className="font-semibold underline underline-offset-4">Dismiss</button>
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
            />
          )}
          {activeArea === "reviews" && <ReportsPanel data={store.data} />}
        </div>
      </div>
    </section>
  );
}
