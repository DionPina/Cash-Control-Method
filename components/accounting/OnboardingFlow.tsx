"use client";

import { useState } from "react";

import { todayIso } from "@/lib/accounting/dates";
import { formatCurrency, parseNonNegativeAmount } from "@/lib/accounting/format";
import { buildOnboardingData } from "@/lib/accounting/onboarding";
import { budgetAmountForMonth } from "@/lib/accounting/planning";
import type {
  AccountingData,
  HousingSituation,
  MealPlanType,
  StudentPriority,
} from "@/lib/accounting/types";

import {
  Field,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  TextInput,
} from "./ui";

type SetupValues = {
  firstName: string;
  priorities: StudentPriority[];
  checkingName: string;
  checkingBalance: string;
  savingsBalance: string;
  incomeSource: string;
  nextIncomeDate: string;
  expectedIncome: string;
  housingSituation: HousingSituation;
  rent: string;
  rentDueDay: string;
  utilitiesIncluded: string;
  utilities: string;
  mealPlanType: "none" | MealPlanType;
  mealPlanName: string;
  mealPlanBalance: string;
  mealPlanSemesterCost: string;
  mealPlanSwipes: string;
  groceries: string;
  diningOut: string;
  transportation: string;
  otherSpending: string;
  safetyBuffer: string;
  debtName: string;
  debtBalance: string;
  minimumPayment: string;
};

const priorityOptions: Array<{
  value: StudentPriority;
  label: string;
  helper: string;
}> = [
  { value: "make-money-last", label: "Make my money last", helper: "See what is available after upcoming needs." },
  { value: "stay-ahead-of-bills", label: "Stay ahead of bills", helper: "Keep required payments visible." },
  { value: "understand-spending", label: "Understand my spending", helper: "See where money goes each week and month." },
  { value: "control-spending", label: "Control flexible spending", helper: "Set realistic amounts for everyday choices." },
  { value: "build-savings", label: "Build savings", helper: "Make steady progress toward a goal or buffer." },
  { value: "reduce-debt", label: "Reduce debt", helper: "Plan payments and see what reduces the balance." },
];

const initialValues: SetupValues = {
  firstName: "",
  priorities: [],
  checkingName: "Checking",
  checkingBalance: "",
  savingsBalance: "",
  incomeSource: "",
  nextIncomeDate: "",
  expectedIncome: "",
  housingSituation: "dorm",
  rent: "",
  rentDueDay: "1",
  utilitiesIncluded: "yes",
  utilities: "",
  mealPlanType: "none",
  mealPlanName: "Campus meal plan",
  mealPlanBalance: "",
  mealPlanSemesterCost: "",
  mealPlanSwipes: "",
  groceries: "",
  diningOut: "",
  transportation: "",
  otherSpending: "",
  safetyBuffer: "",
  debtName: "",
  debtBalance: "",
  minimumPayment: "",
};

export default function OnboardingFlow({
  onComplete,
  onLoadSample,
}: {
  onComplete: (data: AccountingData) => void;
  onLoadSample: () => void;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof SetupValues, value: string | StudentPriority[]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const amount = (value: string) => parseNonNegativeAmount(value) ?? 0;
  const expensePlan =
    amount(values.rent) +
    amount(values.utilities) +
    budgetAmountForMonth(amount(values.groceries), "weekly") +
    budgetAmountForMonth(amount(values.diningOut), "weekly") +
    budgetAmountForMonth(amount(values.transportation), "weekly") +
    budgetAmountForMonth(amount(values.otherSpending), "weekly");

  const next = () => {
    if (step === 1 && values.priorities.length === 0) {
      setError("Choose at least one area you want Cash Control to help with.");
      return;
    }
    if (step === 2 && parseNonNegativeAmount(values.checkingBalance) === null) {
      setError("Enter the amount currently available in your main account.");
      return;
    }
    setStep((current) => Math.min(5, current + 1));
  };

  const finish = () => {
    const today = todayIso();
    onComplete(buildOnboardingData(values, today));
  };

  return (
    <section className="bg-[#f5f7fa] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {step > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Getting started</span>
              <span>{step} of 5</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${step * 20}%` }} />
            </div>
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {step === 0 && (
            <div className="py-4 text-center sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Welcome to Cash Control</p>
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-[#020b24] sm:text-4xl">
                Understand your money. Make more confident decisions.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
                See what comes in, where it goes, and what needs your attention through quick daily check-ins, weekly pacing, and monthly reviews.
              </p>
              <p className="mt-5 text-sm text-slate-500">Setup takes about five minutes. Your information stays in this browser.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <PrimaryButton type="button" onClick={() => setStep(1)}>Get started</PrimaryButton>
                <SecondaryButton type="button" onClick={onLoadSample}>Explore with sample data</SecondaryButton>
              </div>
            </div>
          )}

          {step === 1 && (
            <SetupStep title="What would you like help with?" description="Choose what matters most right now. You can change this later.">
              <Field label="Your first name (optional)"><TextInput value={values.firstName} onChange={(event) => update("firstName", event.target.value)} placeholder="First name" /></Field>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {priorityOptions.map((option) => {
                  const selected = values.priorities.includes(option.value);
                  return (
                    <button key={option.value} type="button" aria-pressed={selected} onClick={() => update("priorities", selected ? values.priorities.filter((item) => item !== option.value) : [...values.priorities, option.value])} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-sky-600 bg-sky-50 ring-1 ring-sky-600" : "border-slate-200 hover:border-slate-300"}`}>
                      <span className="block font-semibold text-[#020b24]">{option.label}</span>
                      <span className="mt-1 block text-sm text-slate-500">{option.helper}</span>
                    </button>
                  );
                })}
              </div>
            </SetupStep>
          )}

          {step === 2 && (
            <SetupStep title="What money do you have today?" description="This becomes your starting point. You can add more accounts later.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Main account name"><TextInput value={values.checkingName} onChange={(event) => update("checkingName", event.target.value)} /></Field>
                <Field label="Available balance"><TextInput inputMode="decimal" value={values.checkingBalance} onChange={(event) => update("checkingBalance", event.target.value)} placeholder="0.00" /></Field>
                <Field label="Savings balance (optional)" helper="Leave blank if you do not want to add savings yet."><TextInput inputMode="decimal" value={values.savingsBalance} onChange={(event) => update("savingsBalance", event.target.value)} placeholder="0.00" /></Field>
              </div>
            </SetupStep>
          )}

          {step === 3 && (
            <SetupStep title="What money do you expect next?" description="A reasonable estimate is enough. Expected money stays separate from money already received.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Source"><TextInput value={values.incomeSource} onChange={(event) => update("incomeSource", event.target.value)} placeholder="Job, scholarship, support…" /></Field>
                <Field label="Expected amount"><TextInput inputMode="decimal" value={values.expectedIncome} onChange={(event) => update("expectedIncome", event.target.value)} placeholder="0.00" /></Field>
                <Field label="Expected date"><TextInput type="date" value={values.nextIncomeDate} onChange={(event) => update("nextIncomeDate", event.target.value)} /></Field>
              </div>
            </SetupStep>
          )}

          {step === 4 && (
            <SetupStep title="What does your money need to cover?" description="Use the timing that feels natural. Housing and utilities are monthly; food and everyday spending start weekly.">
              <div className="rounded-2xl bg-slate-50 p-4">
                <h3 className="font-semibold text-[#020b24]">Housing</h3>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <Field label="Where do you live?"><SelectInput value={values.housingSituation} onChange={(event) => update("housingSituation", event.target.value)}><option value="dorm">Campus dorm</option><option value="off-campus">Apartment or house</option><option value="with-family">With family</option><option value="other">Other</option></SelectInput></Field>
                <Field label={values.housingSituation === "dorm" ? "Monthly housing amount (if paid separately)" : "Monthly rent or housing"}><TextInput inputMode="decimal" value={values.rent} onChange={(event) => update("rent", event.target.value)} placeholder="0.00" /></Field>
                <Field label="Rent due day"><SelectInput value={values.rentDueDay} onChange={(event) => update("rentDueDay", event.target.value)}>{Array.from({ length: 31 }, (_, index) => <option key={index + 1} value={index + 1}>Day {index + 1}</option>)}</SelectInput></Field>
                <Field label="Are utilities included?"><SelectInput value={values.utilitiesIncluded} onChange={(event) => update("utilitiesIncluded", event.target.value)}><option value="yes">Yes, included</option><option value="no">No, I pay them</option><option value="some">Some are included</option></SelectInput></Field>
                {values.utilitiesIncluded !== "yes" && <Field label="Usual utilities per month" helper="Electricity, water, internet, or other shared utilities."><TextInput inputMode="decimal" value={values.utilities} onChange={(event) => update("utilities", event.target.value)} placeholder="0.00" /></Field>}
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <h3 className="font-semibold text-[#020b24]">Food</h3>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Field label="Do you have a meal plan?"><SelectInput value={values.mealPlanType} onChange={(event) => update("mealPlanType", event.target.value)}><option value="none">No meal plan</option><option value="declining-balance">Dining dollars / declining balance</option><option value="swipes">Fixed number of swipes</option><option value="unlimited">Unlimited plan</option></SelectInput></Field>
                  {values.mealPlanType !== "none" && <Field label="Meal-plan name"><TextInput value={values.mealPlanName} onChange={(event) => update("mealPlanName", event.target.value)} /></Field>}
                  {values.mealPlanType !== "none" && <Field label="Restricted balance available now" helper="This is food value, not spendable cash."><TextInput inputMode="decimal" value={values.mealPlanBalance} onChange={(event) => update("mealPlanBalance", event.target.value)} placeholder="0.00" /></Field>}
                  {values.mealPlanType !== "none" && <Field label="Semester cost (optional)"><TextInput inputMode="decimal" value={values.mealPlanSemesterCost} onChange={(event) => update("mealPlanSemesterCost", event.target.value)} placeholder="0.00" /></Field>}
                  {values.mealPlanType === "swipes" && <Field label="Swipes remaining"><TextInput inputMode="numeric" value={values.mealPlanSwipes} onChange={(event) => update("mealPlanSwipes", event.target.value)} placeholder="0" /></Field>}
                  <Field label="Groceries per week"><TextInput inputMode="decimal" value={values.groceries} onChange={(event) => update("groceries", event.target.value)} placeholder="0.00" /></Field>
                  <Field label="Dining out per week"><TextInput inputMode="decimal" value={values.diningOut} onChange={(event) => update("diningOut", event.target.value)} placeholder="0.00" /></Field>
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Transportation per week"><TextInput inputMode="decimal" value={values.transportation} onChange={(event) => update("transportation", event.target.value)} placeholder="0.00" /></Field>
                <Field label="Other flexible spending per week"><TextInput inputMode="decimal" value={values.otherSpending} onChange={(event) => update("otherSpending", event.target.value)} placeholder="0.00" /></Field>
                <Field label="Cash cushion" helper="Money you prefer to leave available."><TextInput inputMode="decimal" value={values.safetyBuffer} onChange={(event) => update("safetyBuffer", event.target.value)} placeholder="0.00" /></Field>
              </div>
            </SetupStep>
          )}

          {step === 5 && (
            <SetupStep title="Review your starting picture" description="Add money you owe if it belongs in your starting picture, then confirm everything below.">
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Debt name (optional)"><TextInput value={values.debtName} onChange={(event) => update("debtName", event.target.value)} placeholder="Credit card or loan" /></Field>
                <Field label="Amount owed"><TextInput inputMode="decimal" value={values.debtBalance} onChange={(event) => update("debtBalance", event.target.value)} placeholder="0.00" /></Field>
                <Field label="Minimum payment"><TextInput inputMode="decimal" value={values.minimumPayment} onChange={(event) => update("minimumPayment", event.target.value)} placeholder="0.00" /></Field>
              </div>
              <dl className="mt-7 grid gap-3 sm:grid-cols-2">
                <ReviewItem label="Cash available" value={formatCurrency(amount(values.checkingBalance) + amount(values.savingsBalance))} />
                <ReviewItem label="Expected money" value={formatCurrency(amount(values.expectedIncome))} />
                <ReviewItem label="Monthly plan equivalent" value={formatCurrency(expensePlan)} />
                <ReviewItem label="Meal-plan value" value={formatCurrency(amount(values.mealPlanBalance))} />
                <ReviewItem label="Cash cushion" value={formatCurrency(amount(values.safetyBuffer))} />
              </dl>
            </SetupStep>
          )}

          {error && <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

          {step > 0 && (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
              <SecondaryButton type="button" onClick={() => setStep((current) => current - 1)}>Back</SecondaryButton>
              {step < 5 ? <PrimaryButton type="button" onClick={next}>Continue</PrimaryButton> : <PrimaryButton type="button" onClick={finish}>Confirm and open Cash Control</PrimaryButton>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SetupStep({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div><h2 className="text-2xl font-semibold tracking-tight text-[#020b24] sm:text-3xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p><div className="mt-7">{children}</div></div>;
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 text-xl font-semibold text-[#020b24]">{value}</dd></div>;
}
