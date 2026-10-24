"use client";

import { useMemo, useState } from "react";

import { EXPENSE_CATEGORIES, getLabel } from "@/lib/accounting/constants";
import { formatDate, formatMonth, startOfMonth, todayIso } from "@/lib/accounting/dates";
import { formatCurrency, parseNonNegativeAmount } from "@/lib/accounting/format";
import { createId } from "@/lib/accounting/id";
import { budgetVariances, calculatePlanProgress, calculateSafeToSpend, planForMonth } from "@/lib/accounting/planning";
import { generatePeriodReport } from "@/lib/accounting/reports";
import type {
  AccountingData,
  ExpenseCategory,
  MonthlyPlan,
  Obligation,
  SavingsGoal,
  StudentProfile,
} from "@/lib/accounting/types";

import {
  DangerButton,
  Field,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  SectionHeading,
  SelectInput,
  TextInput,
} from "./ui";

const planCategories = EXPENSE_CATEGORIES.filter(
  (category) => !["interest", "uncategorized"].includes(category.value),
);
const coreCategoryValues: ExpenseCategory[] = [
  "rent-housing",
  "utilities",
  "phone-internet",
  "groceries",
  "dining-out",
  "gas-transportation",
  "textbooks-school-supplies",
  "entertainment",
];
const coreCategories = planCategories.filter((category) =>
  coreCategoryValues.includes(category.value),
);
const additionalCategories = planCategories.filter(
  (category) => !coreCategoryValues.includes(category.value),
);

export default function PlanPanel({
  data,
  onSavePlan,
  onSaveObligation,
  onDeleteObligation,
  onSaveGoal,
  onDeleteGoal,
  onSaveProfile,
}: {
  data: AccountingData;
  onSavePlan: (plan: MonthlyPlan) => void;
  onSaveObligation: (obligation: Obligation) => void;
  onDeleteObligation: (id: string) => void;
  onSaveGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onSaveProfile: (profile: StudentProfile) => void;
}) {
  const today = todayIso();
  const month = today.slice(0, 7);
  const existingPlan = planForMonth(data, month);
  const [plan, setPlan] = useState(existingPlan);
  const [nextIncomeDate, setNextIncomeDate] = useState(data.profile?.nextIncomeDate ?? "");
  const [nextIncomeAmount, setNextIncomeAmount] = useState(data.profile?.nextIncomeAmount ?? 0);
  const [saved, setSaved] = useState(false);
  const monthly = useMemo(
    () => generatePeriodReport(data, startOfMonth(today), today),
    [data, today],
  );
  const variances = budgetVariances(plan, monthly);
  const progress = calculatePlanProgress(data, today, plan);
  const safe = calculateSafeToSpend(data, today, plan);
  const totalResources = progress.totalCash + progress.expectedIncomeRemaining;
  const remainingUses = progress.plannedExpensesRemaining + progress.uncoveredRequiredPayments +
    progress.debtPaymentRemaining + progress.savingsRemaining + progress.safetyBuffer;
  const unassigned = progress.availableAfterPlan;

  const updateAmount = (field: keyof Pick<MonthlyPlan, "expectedIncome" | "plannedDebtPayment" | "plannedSavings" | "safetyBuffer">, raw: string) => {
    setPlan((current) => ({ ...current, [field]: parseNonNegativeAmount(raw) ?? 0 }));
    setSaved(false);
  };

  const updateCategory = (category: ExpenseCategory, raw: string) => {
    setPlan((current) => ({
      ...current,
      categoryBudgets: {
        ...current.categoryBudgets,
        [category]: parseNonNegativeAmount(raw) ?? 0,
      },
    }));
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Your plan"
        title={`Give your money a purpose for ${formatMonth(`${month}-01`)}`}
        description="Plan once, then let recorded transactions update your progress automatically. You can adjust future choices without changing what actually happened."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PlanMetric label="Cash + money expected" value={totalResources} />
        <PlanMetric label="Expenses still planned" value={progress.plannedExpensesRemaining + progress.uncoveredRequiredPayments} />
        <PlanMetric label="Savings and debt left" value={progress.savingsRemaining + progress.debtPaymentRemaining} />
        <PlanMetric label={unassigned >= 0 ? "Left to plan" : "Plan needs attention"} value={Math.abs(unassigned)} warning={unassigned < 0} />
      </div>

      <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-slate-700">
        Remaining uses total {formatCurrency(remainingUses)}. Required payments and goal contributions only add to this amount when your category or savings plan does not already cover them.
      </p>

      <SectionCard className="bg-[#020b24] text-white">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sky-300">Near-term guardrail</p>
        <h3 className="mt-1 text-xl font-semibold text-white md:text-2xl">Safe to spend through {formatDate(safe.horizonDate)}</h3>
        <p className="mt-1 text-sm text-slate-300">{safe.usesNextIncomeDate ? "This stops before your next expected income arrives." : "No future income date is saved, so this uses the end of the month."}</p>
        <p className={`mt-5 text-4xl font-semibold ${safe.safeToSpend < 0 ? "text-amber-300" : "text-white"}`}>{formatCurrency(safe.safeToSpend)}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <GuardrailItem label="Cash now" value={safe.cashNow} />
          <GuardrailItem label="Bills due first" value={safe.upcomingRequiredPayments} subtract />
          <GuardrailItem label="Pending cash out" value={safe.pendingCashOutflows} subtract />
          <GuardrailItem label="Savings left" value={safe.savingsRemaining} subtract />
          <GuardrailItem label="Cash cushion" value={safe.safetyBuffer} subtract />
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-300">This estimate can only protect bills and pending activity recorded in Cash Control. Update the next income date and required payments whenever timing changes.</p>
      </SectionCard>

      <SectionCard>
        <SectionHeading eyebrow="Master plan" title="Your monthly plan" description="These connected amounts form one plan. Changing a category updates the total immediately." />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Money expected"><MoneyInput value={plan.expectedIncome} onChange={(value) => updateAmount("expectedIncome", value)} /></Field>
          <Field label="Planned debt payments"><MoneyInput value={plan.plannedDebtPayment} onChange={(value) => updateAmount("plannedDebtPayment", value)} /></Field>
          <Field label="Planned savings" helper={`${formatCurrency(progress.savingsContributed)} transferred to savings so far. Goal contributions are covered without being counted twice.`}><MoneyInput value={plan.plannedSavings} onChange={(value) => updateAmount("plannedSavings", value)} /></Field>
          <Field label="Cash cushion" helper="Money you prefer to leave available."><MoneyInput value={plan.safetyBuffer} onChange={(value) => updateAmount("safetyBuffer", value)} /></Field>
        </div>

        <div className="mt-6 grid gap-5 border-t border-[#decfb0] pt-6 sm:grid-cols-2">
          <Field label="Next expected income date" helper="This sets the horizon for the safe-to-spend guardrail."><TextInput type="date" value={nextIncomeDate} onChange={(event) => { setNextIncomeDate(event.target.value); setSaved(false); }} /></Field>
          <Field label="Next expected income amount" helper="For context only; safe-to-spend does not count it before it arrives."><MoneyInput value={nextIncomeAmount} onChange={(value) => { setNextIncomeAmount(parseNonNegativeAmount(value) ?? 0); setSaved(false); }} /></Field>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold text-[#020b24]">Spending categories</h3>
          <p className="mt-1 text-sm text-slate-600">Add only the categories that matter to your plan. Blank categories stay out of the way.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coreCategories.map((category) => (
              <Field key={category.value} label={category.label}>
                <MoneyInput value={plan.categoryBudgets[category.value] ?? 0} onChange={(value) => updateCategory(category.value, value)} />
              </Field>
            ))}
          </div>
          <details className="mt-5 rounded-2xl border border-[#decfb0] bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#020b24]">Add more spending categories</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {additionalCategories.map((category) => (
                <Field key={category.value} label={category.label}>
                  <MoneyInput value={plan.categoryBudgets[category.value] ?? 0} onChange={(value) => updateCategory(category.value, value)} />
                </Field>
              ))}
            </div>
          </details>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#decfb0] pt-6">
          <PrimaryButton type="button" onClick={() => {
            onSavePlan(plan);
            onSaveProfile({
              ...(data.profile ?? { onboardingComplete: true, priorities: [] }),
              nextIncomeDate: nextIncomeDate || undefined,
              nextIncomeAmount: nextIncomeAmount || undefined,
            });
            setSaved(true);
          }}>Save my plan</PrimaryButton>
          {saved && <span role="status" className="text-sm font-medium text-emerald-700">Plan saved.</span>}
          <span className={`ml-auto text-sm font-semibold ${unassigned < 0 ? "text-amber-800" : "text-slate-600"}`}>
            {unassigned >= 0 ? `${formatCurrency(unassigned)} left to assign` : `${formatCurrency(Math.abs(unassigned))} more planned than expected`}
          </span>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeading eyebrow="Plan versus actual" title="How the plan is going" description="Purchases count when they happen, including purchases made with a credit card." />
        {variances.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-600">Add category amounts above to begin comparing your plan with recorded spending.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {variances.map((item) => {
              const width = item.planned > 0 ? Math.min(100, (item.actual / item.planned) * 100) : item.actual > 0 ? 100 : 0;
              return (
                <div key={item.category} className="rounded-2xl border border-[#decfb0] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-[#020b24]">{getLabel(EXPENSE_CATEGORIES, item.category)}</span>
                    <span className={item.remaining < 0 ? "font-semibold text-amber-800" : "text-slate-600"}>
                      {formatCurrency(item.actual)} of {formatCurrency(item.planned)} · {item.remaining >= 0 ? `${formatCurrency(item.remaining)} remaining` : `${formatCurrency(Math.abs(item.remaining))} more than planned`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.remaining < 0 ? "bg-amber-500" : "bg-sky-600"}`} style={{ width: `${width}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <ObligationsCard obligations={data.obligations ?? []} onSave={onSaveObligation} onDelete={onDeleteObligation} />
        <GoalsCard goals={data.goals ?? []} onSave={onSaveGoal} onDelete={onDeleteGoal} />
      </div>
    </div>
  );
}

function MoneyInput({ value, onChange }: { value: number; onChange: (value: string) => void }) {
  return <TextInput inputMode="decimal" value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="0.00" />;
}

function PlanMetric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return <div className={`rounded-2xl border bg-white p-4 shadow-sm ${warning ? "border-amber-300" : "border-slate-200"}`}><p className="text-sm text-slate-500">{label}</p><p className={`mt-1 text-2xl font-semibold ${warning ? "text-amber-800" : "text-[#020b24]"}`}>{formatCurrency(value)}</p></div>;
}

function GuardrailItem({ label, value, subtract = false }: { label: string; value: number; subtract?: boolean }) {
  return <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-slate-300">{subtract ? "− " : ""}{label}</p><p className="mt-1 font-semibold text-white">{formatCurrency(value)}</p></div>;
}

function ObligationsCard({ obligations, onSave, onDelete }: { obligations: Obligation[]; onSave: (item: Obligation) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [category, setCategory] = useState<ExpenseCategory>("rent-housing");

  return (
    <SectionCard>
      <SectionHeading eyebrow="Coming up" title="Bills and required payments" description="Keep due dates visible alongside the category plan." />
      <div className="mt-5 space-y-2">
        {obligations.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm"><div><p className="font-medium text-[#020b24]">{item.name}</p><p className="text-xs text-slate-500">Day {item.dueDay} · {getLabel(EXPENSE_CATEGORIES, item.category)}</p></div><div className="flex items-center gap-3"><span className="font-semibold">{formatCurrency(item.amount)}</span><DangerButton type="button" className="!px-3 !py-1.5" onClick={() => onDelete(item.id)}>Remove</DangerButton></div></div>)}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Payment name"><TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Phone bill" /></Field>
        <Field label="Amount"><TextInput inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></Field>
        <Field label="Due day"><SelectInput value={dueDay} onChange={(event) => setDueDay(event.target.value)}>{Array.from({ length: 31 }, (_, index) => <option key={index + 1} value={index + 1}>Day {index + 1}</option>)}</SelectInput></Field>
        <Field label="Category"><SelectInput value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>{planCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectInput></Field>
      </div>
      <PrimaryButton type="button" className="mt-4" onClick={() => { const parsed = parseNonNegativeAmount(amount) ?? 0; if (!name.trim() || parsed <= 0) return; onSave({ id: createId("obligation"), name: name.trim(), amount: parsed, dueDay: Number(dueDay), category }); setName(""); setAmount(""); }}>Add payment</PrimaryButton>
    </SectionCard>
  );
}

function GoalsCard({ goals, onSave, onDelete }: { goals: SavingsGoal[]; onSave: (item: SavingsGoal) => void; onDelete: (id: string) => void }) {
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [contribution, setContribution] = useState("");
  const [targetDate, setTargetDate] = useState("");

  return (
    <SectionCard>
      <SectionHeading eyebrow="Goals" title="Save for something meaningful" description="Goal money stays part of your cash until the purchase happens; assigning it here helps protect its purpose." />
      <div className="mt-5 space-y-3">
        {goals.map((goal) => { const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0; return <div key={goal.id} className="rounded-2xl bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#020b24]">{goal.name}</p><p className="mt-0.5 text-xs text-slate-500">{formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)} · {formatCurrency(goal.monthlyContribution)}/month</p></div><div className="flex gap-2"><SecondaryButton type="button" className="!px-3 !py-1.5" onClick={() => { setEditingGoal(goal); setName(goal.name); setTarget(String(goal.targetAmount)); setCurrent(String(goal.currentAmount)); setContribution(String(goal.monthlyContribution)); setTargetDate(goal.targetDate ?? ""); }}>Update</SecondaryButton><DangerButton type="button" className="!px-3 !py-1.5" onClick={() => onDelete(goal.id)}>Remove</DangerButton></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} /></div></div>; })}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Goal"><TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Laptop" /></Field>
        <Field label="Target amount"><TextInput inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="0.00" /></Field>
        <Field label="Already set aside"><TextInput inputMode="decimal" value={current} onChange={(event) => setCurrent(event.target.value)} placeholder="0.00" /></Field>
        <Field label="Monthly contribution"><TextInput inputMode="decimal" value={contribution} onChange={(event) => setContribution(event.target.value)} placeholder="0.00" /></Field>
        <Field label="Target date (optional)"><TextInput type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></Field>
      </div>
      <div className="mt-4 flex gap-2"><PrimaryButton type="button" onClick={() => { const targetAmount = parseNonNegativeAmount(target) ?? 0; if (!name.trim() || targetAmount <= 0) return; onSave({ id: editingGoal?.id ?? createId("goal"), name: name.trim(), targetAmount, currentAmount: parseNonNegativeAmount(current) ?? 0, monthlyContribution: parseNonNegativeAmount(contribution) ?? 0, targetDate: targetDate || undefined }); setEditingGoal(null); setName(""); setTarget(""); setCurrent(""); setContribution(""); setTargetDate(""); }}>{editingGoal ? "Save goal" : "Add goal"}</PrimaryButton>{editingGoal && <SecondaryButton type="button" onClick={() => { setEditingGoal(null); setName(""); setTarget(""); setCurrent(""); setContribution(""); setTargetDate(""); }}>Cancel</SecondaryButton>}</div>
    </SectionCard>
  );
}
