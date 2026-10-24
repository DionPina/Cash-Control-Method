"use client";

import { useMemo, useState } from "react";

import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_TYPE_LABELS,
  getLabel,
} from "@/lib/accounting/constants";
import { formatDate } from "@/lib/accounting/dates";
import {
  accountNameForTransaction,
  sortTransactionsNewestFirst,
  transactionReferencesAsset,
  transactionReferencesLiability,
  transactionReferencesMealPlan,
} from "@/lib/accounting/engine";
import { formatCurrency } from "@/lib/accounting/format";
import type {
  AccountingData,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/lib/accounting/types";

import {
  DangerButton,
  EmptyState,
  SecondaryButton,
  SectionCard,
  SectionHeading,
  SelectInput,
  StatusPill,
  TextInput,
} from "./ui";

type TransactionLedgerProps = {
  data: AccountingData;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onRecord: () => void;
};

export default function TransactionLedger({
  data,
  onEdit,
  onDelete,
  onRecord,
}: TransactionLedgerProps) {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>("");
  const [statusFilter, setStatusFilter] = useState<"" | TransactionStatus>("");
  const [uncategorizedOnly, setUncategorizedOnly] = useState(false);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return sortTransactionsNewestFirst(data.transactions).filter((transaction) => {
      if (normalizedSearch && !transaction.description.toLowerCase().includes(normalizedSearch)) return false;
      if (startDate && transaction.date < startDate) return false;
      if (endDate && transaction.date > endDate) return false;
      if (typeFilter && transaction.type !== typeFilter) return false;
      if (statusFilter && transaction.status !== statusFilter) return false;
      if (uncategorizedOnly && !(transaction.type === "expense" && transaction.category === "uncategorized")) return false;
      if (categoryFilter && transactionCategoryValue(transaction) !== categoryFilter) return false;
      if (accountFilter) {
        const [kind, id] = accountFilter.split(":");
        const matches = kind === "asset" ? transactionReferencesAsset(transaction, id)
          : kind === "liability" ? transactionReferencesLiability(transaction, id)
          : transactionReferencesMealPlan(transaction, id);
        if (!matches) return false;
      }
      return true;
    });
  }, [
    accountFilter,
    categoryFilter,
    data.transactions,
    endDate,
    search,
    startDate,
    statusFilter,
    typeFilter,
    uncategorizedOnly,
  ]);

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setAccountFilter("");
    setCategoryFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setUncategorizedOnly(false);
  };

  const requestDelete = (transaction: Transaction) => {
    if (
      window.confirm(
        `Delete “${transaction.description}” for ${formatCurrency(transaction.amount)}? Account balances and reports will update immediately.`,
      )
    ) {
      onDelete(transaction.id);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Transactions"
        title="Complete transaction ledger"
        description="This ledger is the single source of truth for balances and reports. Newest activity appears first."
        action={<SecondaryButton type="button" onClick={onRecord}>Record transaction</SecondaryButton>}
      />

      <SectionCard>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TextInput aria-label="Search transactions" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search descriptions" />
          <TextInput aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <TextInput aria-label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <SelectInput aria-label="Filter by account" value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
            <option value="">All accounts</option>
            <optgroup label="Cash accounts">{data.assetAccounts.map((account) => <option key={account.id} value={`asset:${account.id}`}>{account.name}</option>)}</optgroup>
            <optgroup label="Liabilities">{data.liabilityAccounts.map((account) => <option key={account.id} value={`liability:${account.id}`}>{account.name}</option>)}</optgroup>
            <optgroup label="Meal plans">{(data.mealPlanAccounts ?? []).map((account) => <option key={account.id} value={`meal-plan:${account.id}`}>{account.name}</option>)}</optgroup>
          </SelectInput>
          <SelectInput aria-label="Filter by transaction type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "" | TransactionType)}>
            <option value="">All transaction types</option>
            {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectInput>
          <SelectInput aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">All categories</option>
            <optgroup label="Income and funding">{INCOME_CATEGORIES.map((category) => <option key={`income:${category.value}`} value={`income:${category.value}`}>{category.label}</option>)}</optgroup>
            <optgroup label="Expenses">{EXPENSE_CATEGORIES.map((category) => <option key={`expense:${category.value}`} value={`expense:${category.value}`}>{category.label}</option>)}</optgroup>
          </SelectInput>
          <SelectInput aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "" | TransactionStatus)}>
            <option value="">Posted and pending</option>
            <option value="posted">Posted only</option>
            <option value="pending">Pending only</option>
          </SelectInput>
          <label className="flex items-center gap-2 rounded-xl border border-[#d9cdb7] bg-white px-3 py-2.5 text-sm text-slate-700">
            <input type="checkbox" checked={uncategorizedOnly} onChange={(event) => setUncategorizedOnly(event.target.checked)} className="h-4 w-4 accent-[#020b24]" />
            Uncategorized only
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 text-sm">
          <p className="text-slate-600">Showing {filtered.length} of {data.transactions.length} transactions</p>
          <button type="button" onClick={clearFilters} className="font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4">Clear filters</button>
        </div>
      </SectionCard>

      <SectionCard>
        {filtered.length === 0 ? (
          <EmptyState
            title={data.transactions.length ? "No transactions match these filters" : "Your ledger is empty"}
            description={data.transactions.length ? "Clear or adjust the filters to see more activity." : "Record what happened to begin building balances and financial reports."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-[#decfb0] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Account(s)</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Amount</th>
                  <th className="pb-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-[#eadfc9] align-top last:border-0">
                    <td className="py-4 text-slate-600">{formatDate(transaction.date)}</td>
                    <td className="py-4 font-medium text-[#020b24]">
                      {transaction.description}
                      {transaction.note && <span className="mt-1 block max-w-xs text-xs font-normal text-slate-500">{transaction.note}</span>}
                    </td>
                    <td className="py-4 text-slate-600">{TRANSACTION_TYPE_LABELS[transaction.type]}</td>
                    <td className="py-4 text-slate-600">{accountNameForTransaction(transaction, data)}</td>
                    <td className="py-4 text-slate-600">{transactionCategoryLabel(transaction)}</td>
                    <td className="py-4"><StatusPill status={transaction.status} /></td>
                    <td className="py-4 text-right font-semibold text-[#020b24]">
                      {formatCurrency(transaction.amount)}
                      {transaction.type === "debt-payment" && <span className="mt-1 block text-xs font-normal text-slate-500">{formatCurrency(transaction.principalAmount)} principal · {formatCurrency(transaction.interestAmount)} interest</span>}
                    </td>
                    <td className="py-4"><div className="flex justify-end gap-2"><SecondaryButton type="button" onClick={() => onEdit(transaction)}>Edit</SecondaryButton><DangerButton type="button" onClick={() => requestDelete(transaction)}>Delete</DangerButton></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function transactionCategoryValue(transaction: Transaction): string {
  if (transaction.type === "income") return `income:${transaction.category}`;
  if (transaction.type === "expense") return `expense:${transaction.category}`;
  if (transaction.type === "debt-payment" && transaction.interestAmount > 0) return "expense:interest";
  if (transaction.type === "meal-plan-use") return `expense:${transaction.category}`;
  return "";
}

function transactionCategoryLabel(transaction: Transaction): string {
  if (transaction.type === "income") return getLabel(INCOME_CATEGORIES, transaction.category);
  if (transaction.type === "expense") return getLabel(EXPENSE_CATEGORIES, transaction.category);
  if (transaction.type === "debt-payment" && transaction.interestAmount > 0) return "Interest";
  if (transaction.type === "meal-plan-use") return getLabel(EXPENSE_CATEGORIES, transaction.category);
  return "—";
}
