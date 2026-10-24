"use client";

import { useState } from "react";

import {
  ASSET_ACCOUNT_TYPES,
  LIABILITY_ACCOUNT_TYPES,
  getLabel,
} from "@/lib/accounting/constants";
import { formatDate, todayIso } from "@/lib/accounting/dates";
import {
  calculateAssetBalance,
  calculateLiabilityBalance,
} from "@/lib/accounting/engine";
import { formatCurrency, parseNonNegativeAmount } from "@/lib/accounting/format";
import { createId } from "@/lib/accounting/id";
import type {
  AccountingData,
  AssetAccount,
  AssetAccountType,
  LiabilityAccount,
  LiabilityAccountType,
} from "@/lib/accounting/types";
import {
  assetAccountHasTransactions,
  liabilityAccountHasTransactions,
  validateAssetAccount,
  validateLiabilityAccount,
} from "@/lib/accounting/validation";

import {
  DangerButton,
  EmptyState,
  Field,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  SectionHeading,
  SelectInput,
  TextInput,
} from "./ui";

type AccountsPanelProps = {
  data: AccountingData;
  onSaveAsset: (account: AssetAccount) => void;
  onSaveLiability: (account: LiabilityAccount) => void;
  onDeleteAsset: (id: string) => void;
  onDeleteLiability: (id: string) => void;
};

export default function AccountsPanel({
  data,
  onSaveAsset,
  onSaveLiability,
  onDeleteAsset,
  onDeleteLiability,
}: AccountsPanelProps) {
  const [formType, setFormType] = useState<"asset" | "liability" | null>(null);
  const [editingAsset, setEditingAsset] = useState<AssetAccount | null>(null);
  const [editingLiability, setEditingLiability] = useState<LiabilityAccount | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const today = todayIso();

  const closeForm = () => {
    setFormType(null);
    setEditingAsset(null);
    setEditingLiability(null);
  };

  const requestAssetDelete = (account: AssetAccount) => {
    if (assetAccountHasTransactions(account.id, data.transactions)) {
      setMessage(
        `${account.name} cannot be deleted because ledger transactions reference it. Edit or reassign those transactions first.`,
      );
      return;
    }
    if (window.confirm(`Delete ${account.name}? This cannot be undone.`)) {
      onDeleteAsset(account.id);
      setMessage(`${account.name} was deleted.`);
    }
  };

  const requestLiabilityDelete = (account: LiabilityAccount) => {
    if (liabilityAccountHasTransactions(account.id, data.transactions)) {
      setMessage(
        `${account.name} cannot be deleted because ledger transactions reference it. Edit or reassign those transactions first.`,
      );
      return;
    }
    if (window.confirm(`Delete ${account.name}? This cannot be undone.`)) {
      onDeleteLiability(account.id);
      setMessage(`${account.name} was deleted.`);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Accounts"
        title="Your starting balances and current position"
        description="Opening balances establish where each account began. Current balances are calculated automatically from posted ledger activity."
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryButton
              type="button"
              onClick={() => {
                setEditingAsset(null);
                setFormType("asset");
              }}
            >
              Add cash account
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={() => {
                setEditingLiability(null);
                setFormType("liability");
              }}
            >
              Add liability
            </PrimaryButton>
          </div>
        }
      />

      {message && (
        <div role="status" className="flex items-start justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700">
          <p>{message}</p>
          <button type="button" onClick={() => setMessage(null)} className="font-semibold text-sky-900">Dismiss</button>
        </div>
      )}

      {formType === "asset" && (
        <AssetAccountForm
          account={editingAsset}
          transactions={data.transactions}
          onCancel={closeForm}
          onSave={(account) => {
            onSaveAsset(account);
            setMessage(`${account.name} was saved.`);
            closeForm();
          }}
        />
      )}
      {formType === "liability" && (
        <LiabilityAccountForm
          account={editingLiability}
          transactions={data.transactions}
          onCancel={closeForm}
          onSave={(account) => {
            onSaveLiability(account);
            setMessage(`${account.name} was saved.`);
            closeForm();
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <SectionHeading eyebrow="Cash and assets" title="Cash accounts" />
          {data.assetAccounts.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No cash accounts"
                description="Create a checking, savings, cash, or other cash account to establish your opening position."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {data.assetAccounts.map((account) => {
                const balance = calculateAssetBalance(
                  account,
                  data.transactions,
                  { date: today, includeDate: true },
                );
                return (
                  <AccountCard
                    key={account.id}
                    name={account.name}
                    type={getLabel(ASSET_ACCOUNT_TYPES, account.type)}
                    openingBalance={account.openingBalance}
                    openingDate={account.openingBalanceDate}
                    currentBalance={balance}
                    onEdit={() => {
                      setEditingAsset(account);
                      setFormType("asset");
                    }}
                    onDelete={() => requestAssetDelete(account)}
                  />
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeading eyebrow="What you owe" title="Liability accounts" />
          {data.liabilityAccounts.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No liabilities"
                description="Add credit cards, student loans, or other amounts owed when they apply to you."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {data.liabilityAccounts.map((account) => {
                const balance = calculateLiabilityBalance(
                  account,
                  data.transactions,
                  { date: today, includeDate: true },
                );
                return (
                  <AccountCard
                    key={account.id}
                    name={account.name}
                    type={getLabel(LIABILITY_ACCOUNT_TYPES, account.type)}
                    openingBalance={account.openingBalance}
                    openingDate={account.openingBalanceDate}
                    currentBalance={balance}
                    details={[
                      account.interestRate !== undefined ? `${account.interestRate}% interest` : null,
                      account.minimumPayment !== undefined ? `${formatCurrency(account.minimumPayment)} minimum` : null,
                      account.dueDay !== undefined ? `Due day ${account.dueDay}` : null,
                    ].filter(Boolean).join(" · ")}
                    onEdit={() => {
                      setEditingLiability(account);
                      setFormType("liability");
                    }}
                    onDelete={() => requestLiabilityDelete(account)}
                  />
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-slate-700">
        Borrowed money can increase cash, but it also increases what you owe. Cash Control keeps both sides visible.
      </p>
    </div>
  );
}

function AccountCard({
  name,
  type,
  openingBalance,
  openingDate,
  currentBalance,
  details,
  onEdit,
  onDelete,
}: {
  name: string;
  type: string;
  openingBalance: number;
  openingDate: string;
  currentBalance: number;
  details?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[#decfb0] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[#020b24]">{name}</h3>
          <p className="text-xs text-slate-500">{type}</p>
        </div>
        <p className={`text-lg font-semibold ${currentBalance < 0 ? "text-rose-700" : "text-[#020b24]"}`}>
          {formatCurrency(currentBalance)}
        </p>
      </div>
      <div className="mt-3 text-xs text-slate-600">
        Opening balance: {formatCurrency(openingBalance)} on {formatDate(openingDate)}
        {details && <span className="mt-1 block">{details}</span>}
      </div>
      <div className="mt-4 flex gap-2">
        <SecondaryButton type="button" onClick={onEdit}>Edit</SecondaryButton>
        <DangerButton type="button" onClick={onDelete}>Delete</DangerButton>
      </div>
    </article>
  );
}

function AssetAccountForm({ account, transactions, onSave, onCancel }: { account: AssetAccount | null; transactions: AccountingData["transactions"]; onSave: (account: AssetAccount) => void; onCancel: () => void }) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AssetAccountType>(account?.type ?? "checking");
  const [openingBalance, setOpeningBalance] = useState(account ? String(account.openingBalance) : "");
  const [openingDate, setOpeningDate] = useState(account?.openingBalanceDate ?? todayIso());
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    const parsedBalance = parseNonNegativeAmount(openingBalance);
    const next: AssetAccount = {
      id: account?.id ?? createId("asset"),
      name: name.trim(),
      type,
      openingBalance: parsedBalance ?? Number.NaN,
      openingBalanceDate: openingDate,
    };
    const nextErrors = validateAssetAccount(next, transactions);
    if (nextErrors.length) return setErrors(nextErrors);
    onSave(next);
  };

  return (
    <SectionCard>
      <SectionHeading eyebrow={account ? "Edit account" : "New account"} title="Cash or asset account" />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Account name"><TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Campus Checking" /></Field>
        <Field label="Account type"><SelectInput value={type} onChange={(event) => setType(event.target.value as AssetAccountType)}>{ASSET_ACCOUNT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectInput></Field>
        <Field label="Opening balance"><TextInput inputMode="decimal" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} placeholder="0.00" /></Field>
        <Field label="Opening balance date"><TextInput type="date" value={openingDate} onChange={(event) => setOpeningDate(event.target.value)} /></Field>
      </div>
      <FormErrors errors={errors} />
      <div className="mt-5 flex gap-2"><PrimaryButton type="button" onClick={submit}>Save account</PrimaryButton><SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton></div>
    </SectionCard>
  );
}

function LiabilityAccountForm({ account, transactions, onSave, onCancel }: { account: LiabilityAccount | null; transactions: AccountingData["transactions"]; onSave: (account: LiabilityAccount) => void; onCancel: () => void }) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<LiabilityAccountType>(account?.type ?? "credit-card");
  const [openingBalance, setOpeningBalance] = useState(account ? String(account.openingBalance) : "");
  const [openingDate, setOpeningDate] = useState(account?.openingBalanceDate ?? todayIso());
  const [interestRate, setInterestRate] = useState(account?.interestRate === undefined ? "" : String(account.interestRate));
  const [minimumPayment, setMinimumPayment] = useState(account?.minimumPayment === undefined ? "" : String(account.minimumPayment));
  const [dueDay, setDueDay] = useState(account?.dueDay === undefined ? "" : String(account.dueDay));
  const [errors, setErrors] = useState<string[]>([]);

  const optionalNumber = (raw: string) => raw.trim() === "" ? undefined : Number(raw);
  const submit = () => {
    const parsedBalance = parseNonNegativeAmount(openingBalance);
    const next: LiabilityAccount = {
      id: account?.id ?? createId("liability"),
      name: name.trim(),
      type,
      openingBalance: parsedBalance ?? Number.NaN,
      openingBalanceDate: openingDate,
      interestRate: optionalNumber(interestRate),
      minimumPayment: optionalNumber(minimumPayment),
      dueDay: optionalNumber(dueDay),
    };
    const nextErrors = validateLiabilityAccount(next, transactions);
    if (nextErrors.length) return setErrors(nextErrors);
    onSave(next);
  };

  return (
    <SectionCard>
      <SectionHeading eyebrow={account ? "Edit liability" : "New liability"} title="Liability account" />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Liability name"><TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Student Credit Card" /></Field>
        <Field label="Liability type"><SelectInput value={type} onChange={(event) => setType(event.target.value as LiabilityAccountType)}>{LIABILITY_ACCOUNT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectInput></Field>
        <Field label="Opening balance owed"><TextInput inputMode="decimal" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} placeholder="0.00" /></Field>
        <Field label="Opening balance date"><TextInput type="date" value={openingDate} onChange={(event) => setOpeningDate(event.target.value)} /></Field>
        <Field label="Interest rate (optional)" helper="Enter the annual percentage rate, such as 22.9."><TextInput inputMode="decimal" value={interestRate} onChange={(event) => setInterestRate(event.target.value)} placeholder="e.g. 22.9" /></Field>
        <Field label="Minimum payment (optional)"><TextInput inputMode="decimal" value={minimumPayment} onChange={(event) => setMinimumPayment(event.target.value)} placeholder="e.g. 35" /></Field>
        <Field label="Due day (optional)" helper="A number from 1 to 31."><TextInput inputMode="numeric" value={dueDay} onChange={(event) => setDueDay(event.target.value)} placeholder="e.g. 18" /></Field>
      </div>
      <FormErrors errors={errors} />
      <div className="mt-5 flex gap-2"><PrimaryButton type="button" onClick={submit}>Save liability</PrimaryButton><SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton></div>
    </SectionCard>
  );
}

function FormErrors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><p className="font-semibold">Please fix the following:</p><ul className="mt-1 list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;
}
