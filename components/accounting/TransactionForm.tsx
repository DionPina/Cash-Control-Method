"use client";

import { useState } from "react";

import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  RECORD_CHOICES,
} from "@/lib/accounting/constants";
import { todayIso } from "@/lib/accounting/dates";
import { formatCurrency, parseNonNegativeAmount, parsePositiveAmount } from "@/lib/accounting/format";
import { createId } from "@/lib/accounting/id";
import type {
  AccountingData,
  ExpenseCategory,
  IncomeCategory,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/lib/accounting/types";
import { validateTransaction } from "@/lib/accounting/validation";

import {
  EmptyState,
  Field,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  SectionHeading,
  SelectInput,
  TextArea,
  TextInput,
} from "./ui";

type TransactionFormProps = {
  data: AccountingData;
  editingTransaction?: Transaction | null;
  onSave: (transaction: Transaction) => void;
  onCancelEdit?: () => void;
  onCreateAccount: () => void;
};

export default function TransactionForm({
  data,
  editingTransaction,
  onSave,
  onCancelEdit,
  onCreateAccount,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(editingTransaction?.type ?? "expense");
  const [date, setDate] = useState(editingTransaction?.date ?? todayIso());
  const [description, setDescription] = useState(editingTransaction?.description ?? "");
  const [amount, setAmount] = useState(
    editingTransaction && editingTransaction.type !== "debt-payment"
      ? String(editingTransaction.amount)
      : "",
  );
  const [status, setStatus] = useState<TransactionStatus>(editingTransaction?.status ?? "posted");
  const [note, setNote] = useState(editingTransaction?.note ?? "");
  const [assetAccountId, setAssetAccountId] = useState(initialAssetId(editingTransaction));
  const [secondAssetAccountId, setSecondAssetAccountId] = useState(
    editingTransaction?.type === "transfer" ? editingTransaction.destinationAssetAccountId : "",
  );
  const [liabilityAccountId, setLiabilityAccountId] = useState(initialLiabilityId(editingTransaction));
  const [paymentAccount, setPaymentAccount] = useState(initialPaymentAccount(editingTransaction));
  const [mealPlanAccountId, setMealPlanAccountId] = useState(
    editingTransaction?.type === "meal-plan-funding" || editingTransaction?.type === "meal-plan-use" ? editingTransaction.mealPlanAccountId : "",
  );
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>(
    editingTransaction?.type === "income" ? editingTransaction.category : "wages-salary",
  );
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>(
    editingTransaction?.type === "expense" ? editingTransaction.category : "uncategorized",
  );
  const [principalAmount, setPrincipalAmount] = useState(
    editingTransaction?.type === "debt-payment" ? String(editingTransaction.principalAmount) : "",
  );
  const [interestAmount, setInterestAmount] = useState(
    editingTransaction?.type === "debt-payment" ? String(editingTransaction.interestAmount) : "",
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const hasAssets = data.assetAccounts.length > 0;
  const hasLiabilities = data.liabilityAccounts.length > 0;
  const hasMealPlans = (data.mealPlanAccounts ?? []).length > 0;

  const chooseType = (nextType: TransactionType) => {
    setType(nextType);
    setErrors([]);
    setSavedMessage(null);
  };

  const buildTransaction = (): Transaction => {
    const id = editingTransaction?.id ?? createId("transaction");
    const createdAt = editingTransaction?.createdAt ?? new Date().toISOString();
    const common = {
      id,
      date,
      description: description.trim(),
      status,
      note: note.trim() || undefined,
      createdAt,
    };

    if (type === "income") {
      return {
        ...common,
        type,
        amount: parsePositiveAmount(amount) ?? Number.NaN,
        destinationAssetAccountId: assetAccountId,
        category: incomeCategory,
      };
    }
    if (type === "expense") {
      const [paymentAccountType, paymentAccountId = ""] = paymentAccount.split(":");
      return {
        ...common,
        type,
        amount: parsePositiveAmount(amount) ?? Number.NaN,
        paymentAccountType: paymentAccountType === "liability" ? "liability" : "asset",
        paymentAccountId,
        category: expenseCategory,
      };
    }
    if (type === "borrowing") {
      return {
        ...common,
        type,
        amount: parsePositiveAmount(amount) ?? Number.NaN,
        destinationAssetAccountId: assetAccountId,
        liabilityAccountId,
      };
    }
    if (type === "debt-payment") {
      const principal = parseNonNegativeAmount(principalAmount) ?? Number.NaN;
      const interest = parseNonNegativeAmount(interestAmount) ?? Number.NaN;
      return {
        ...common,
        type,
        amount: principal + interest,
        cashAccountId: assetAccountId,
        liabilityAccountId,
        principalAmount: principal,
        interestAmount: interest,
      };
    }
    if (type === "meal-plan-funding") {
      const [paymentAccountType, paymentAccountId = ""] = paymentAccount.split(":");
      return { ...common, type, amount: parsePositiveAmount(amount) ?? Number.NaN, paymentAccountType: paymentAccountType === "liability" ? "liability" : "asset", paymentAccountId, mealPlanAccountId };
    }
    if (type === "meal-plan-use") {
      return { ...common, type, amount: parsePositiveAmount(amount) ?? Number.NaN, mealPlanAccountId, category: expenseCategory === "groceries" ? "groceries" : "dining-out" };
    }
    return {
      ...common,
      type: "transfer",
      amount: parsePositiveAmount(amount) ?? Number.NaN,
      sourceAssetAccountId: assetAccountId,
      destinationAssetAccountId: secondAssetAccountId,
    };
  };

  const submit = () => {
    const transaction = buildTransaction();
    const nextErrors = validateTransaction(transaction, data);
    if (nextErrors.length) {
      setErrors(nextErrors);
      setSavedMessage(null);
      return;
    }

    onSave(transaction);
    setErrors([]);
    setSavedMessage(editingTransaction ? "Transaction updated." : "Transaction added to the ledger.");
    if (!editingTransaction) {
      setDescription("");
      setAmount("");
      setNote("");
      setPrincipalAmount("");
      setInterestAmount("");
    }
  };

  if (!hasAssets) {
    return (
      <EmptyState
        title="Create a cash account before recording transactions"
        description="Transactions need an account so Cash Control can maintain accurate balances."
        action={<PrimaryButton type="button" onClick={onCreateAccount}>Go to Accounts</PrimaryButton>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={editingTransaction ? "Edit ledger entry" : "Record"}
        title={editingTransaction ? "Correct what happened" : "What happened?"}
        description="Enter a positive amount. The transaction type determines which accounts increase or decrease."
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Transaction type">
        {RECORD_CHOICES.map((choice) => (
          <button
            key={choice.value}
            type="button"
            aria-pressed={type === choice.value}
            onClick={() => chooseType(choice.value)}
            className={`rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
              type === choice.value
                ? "border-[#020b24] bg-[#020b24] text-white"
                : "border-[#decfb0] bg-white text-[#020b24] hover:bg-[#fdfaf4]"
            }`}
          >
            <span className="block text-sm font-semibold">{choice.label}</span>
            <span className={`mt-1 block text-xs ${type === choice.value ? "text-slate-300" : "text-slate-500"}`}>
              {choice.helper}
            </span>
          </button>
        ))}
      </div>

      <SectionCard>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Date"><TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
          <Field label="Description"><TextInput value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What happened?" /></Field>

          {type !== "debt-payment" && (
            <Field label="Amount"><TextInput inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></Field>
          )}

          {type === "income" && (
            <>
              <AssetSelect label="Destination cash account" value={assetAccountId} onChange={setAssetAccountId} data={data} />
              <Field label="Income or funding category"><SelectInput value={incomeCategory} onChange={(event) => setIncomeCategory(event.target.value as IncomeCategory)}>{INCOME_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</SelectInput></Field>
            </>
          )}

          {type === "expense" && (
            <>
              <Field label="Payment account"><SelectInput value={paymentAccount} onChange={(event) => setPaymentAccount(event.target.value)}><option value="">Select an account</option><optgroup label="Cash accounts">{data.assetAccounts.map((account) => <option key={account.id} value={`asset:${account.id}`}>{account.name}</option>)}</optgroup><optgroup label="Credit cards and liabilities">{data.liabilityAccounts.map((account) => <option key={account.id} value={`liability:${account.id}`}>{account.name}</option>)}</optgroup></SelectInput></Field>
              <Field label="Expense category" helper="You can leave this uncategorized and review it later."><SelectInput value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value as ExpenseCategory)}>{EXPENSE_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</SelectInput></Field>
            </>
          )}

          {type === "borrowing" && (
            <>
              <AssetSelect label="Destination cash account" value={assetAccountId} onChange={setAssetAccountId} data={data} />
              <LiabilitySelect label="Liability account" value={liabilityAccountId} onChange={setLiabilityAccountId} data={data} />
            </>
          )}

          {type === "debt-payment" && (
            <>
              <AssetSelect label="Cash account used" value={assetAccountId} onChange={setAssetAccountId} data={data} />
              <LiabilitySelect label="Liability being paid" value={liabilityAccountId} onChange={setLiabilityAccountId} data={data} />
              <Field label="Principal amount" helper="This portion reduces the balance owed."><TextInput inputMode="decimal" value={principalAmount} onChange={(event) => setPrincipalAmount(event.target.value)} placeholder="0.00" /></Field>
              <Field label="Interest amount" helper="Interest is recorded as an expense."><TextInput inputMode="decimal" value={interestAmount} onChange={(event) => setInterestAmount(event.target.value)} placeholder="0.00" /></Field>
              <div className="rounded-xl border border-[#decfb0] bg-sky-50 px-4 py-3 text-sm md:col-span-2">
                Total payment: <span className="font-semibold">{formatCurrency((parseNonNegativeAmount(principalAmount) ?? 0) + (parseNonNegativeAmount(interestAmount) ?? 0))}</span>
              </div>
            </>
          )}

          {type === "transfer" && (
            <>
              <AssetSelect label="Source cash account" value={assetAccountId} onChange={setAssetAccountId} data={data} />
              <AssetSelect label="Destination cash account" value={secondAssetAccountId} onChange={setSecondAssetAccountId} data={data} />
            </>
          )}

          {type === "meal-plan-funding" && (
            <>
              <Field label="Account used"><SelectInput value={paymentAccount} onChange={(event) => setPaymentAccount(event.target.value)}><option value="">Select an account</option><optgroup label="Cash accounts">{data.assetAccounts.map((account) => <option key={account.id} value={`asset:${account.id}`}>{account.name}</option>)}</optgroup><optgroup label="Credit or student account">{data.liabilityAccounts.map((account) => <option key={account.id} value={`liability:${account.id}`}>{account.name}</option>)}</optgroup></SelectInput></Field>
              <MealPlanSelect value={mealPlanAccountId} onChange={setMealPlanAccountId} data={data} />
            </>
          )}

          {type === "meal-plan-use" && (
            <>
              <MealPlanSelect value={mealPlanAccountId} onChange={setMealPlanAccountId} data={data} />
              <Field label="Food category"><SelectInput value={expenseCategory === "groceries" ? "groceries" : "dining-out"} onChange={(event) => setExpenseCategory(event.target.value as ExpenseCategory)}><option value="groceries">Groceries</option><option value="dining-out">Dining out</option></SelectInput></Field>
            </>
          )}

          <Field label="Status" helper="Only posted transactions affect balances and reports."><SelectInput value={status} onChange={(event) => setStatus(event.target.value as TransactionStatus)}><option value="posted">Posted</option><option value="pending">Pending</option></SelectInput></Field>
          <Field label="Note (optional)"><TextArea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for your records" /></Field>
        </div>

        <EducationNote type={type} hasLiabilities={hasLiabilities} hasMealPlans={hasMealPlans} />

        {errors.length > 0 && (
          <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <p className="font-semibold">Please fix the following:</p>
            <ul className="mt-1 list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </div>
        )}
        {savedMessage && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{savedMessage}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={submit}>{editingTransaction ? "Update transaction" : "Add to ledger"}</PrimaryButton>
          {editingTransaction && onCancelEdit && <SecondaryButton type="button" onClick={onCancelEdit}>Cancel editing</SecondaryButton>}
        </div>
      </SectionCard>
    </div>
  );
}

function initialAssetId(transaction?: Transaction | null): string {
  if (!transaction) return "";
  if (transaction.type === "income" || transaction.type === "borrowing") return transaction.destinationAssetAccountId;
  if (transaction.type === "debt-payment") return transaction.cashAccountId;
  if (transaction.type === "transfer") return transaction.sourceAssetAccountId;
  return "";
}

function initialLiabilityId(transaction?: Transaction | null): string {
  if (transaction?.type === "borrowing" || transaction?.type === "debt-payment") return transaction.liabilityAccountId;
  return "";
}

function initialPaymentAccount(transaction?: Transaction | null): string {
  return transaction?.type === "expense" || transaction?.type === "meal-plan-funding" ? `${transaction.paymentAccountType}:${transaction.paymentAccountId}` : "";
}

function AssetSelect({ label, value, onChange, data }: { label: string; value: string; onChange: (value: string) => void; data: AccountingData }) {
  return <Field label={label}><SelectInput value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select a cash account</option>{data.assetAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</SelectInput></Field>;
}

function LiabilitySelect({ label, value, onChange, data }: { label: string; value: string; onChange: (value: string) => void; data: AccountingData }) {
  return <Field label={label}><SelectInput value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select a liability</option>{data.liabilityAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</SelectInput></Field>;
}

function MealPlanSelect({ value, onChange, data }: { value: string; onChange: (value: string) => void; data: AccountingData }) {
  return <Field label="Meal plan"><SelectInput value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select a meal plan</option>{(data.mealPlanAccounts ?? []).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</SelectInput></Field>;
}

function EducationNote({ type, hasLiabilities, hasMealPlans }: { type: TransactionType; hasLiabilities: boolean; hasMealPlans: boolean }) {
  const messages: Record<TransactionType, string> = {
    income: "Income and non-borrowed funding increases cash. Borrowed money belongs under borrowing instead.",
    expense: "A credit-card purchase records the expense now and increases what you owe. It does not reduce cash until you pay the card.",
    borrowing: hasLiabilities ? "Borrowed money increases your cash, but it also increases what you owe." : "Create a liability account before recording borrowed money.",
    "debt-payment": "A credit-card payment reduces cash and debt. The original purchase is the expense; only interest is a new expense here.",
    transfer: "Moving money between your accounts is a transfer, not income or an expense.",
    "meal-plan-funding": hasMealPlans ? "Funding a meal plan lowers spendable cash or increases a student-account balance, but it creates restricted food value rather than an immediate food expense." : "Create a meal plan under Accounts & setup before funding it.",
    "meal-plan-use": hasMealPlans ? "Using dining dollars records food spending and reduces restricted meal-plan value without lowering cash again." : "Create a meal plan under Accounts & setup before recording meal-plan use.",
  };
  return <p className="mt-5 rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-relaxed text-slate-700">{messages[type]}</p>;
}
