// app/components/CashControlSummary.tsx
"use client";

import React from "react";

type SummaryItem = {
  label: string;
  value: number | null | undefined;
  helper?: string;
  badge?: string;
};

interface CashControlSummaryProps {
  items: SummaryItem[];
}

export default function CashControlSummary({ items }: CashControlSummaryProps) {
  return (
    <section className="mt-2">
      <h2 className="text-2xl font-semibold mb-4">Cash Control Summary</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3.5 md:p-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm text-gray-500">{item.label}</p>
              {item.badge && (
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-sky-700">
                  {item.badge}
                </span>
              )}
            </div>

            <p className="text-xl font-bold mt-2">
              {formatDisplayValue(item)}
            </p>

            {item.helper && (
              <p className="text-xs text-gray-400 mt-1.5 md:mt-2 leading-snug">
                {item.helper}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------
   Helper functions for formatting currency/percentages
------------------------------------------------------ */

function formatDisplayValue(item: SummaryItem): string {
  const isPercentage = item.label.toLowerCase().includes("rate");
  return isPercentage
    ? formatPercentage(item.value)
    : formatCurrency(item.value);
}

function formatCurrency(rawValue?: number | null): string {
  const value =
    typeof rawValue === "number" && !Number.isNaN(rawValue) ? rawValue : 0;

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatPercentage(rawValue?: number | null): string {
  const value =
    typeof rawValue === "number" && !Number.isNaN(rawValue) ? rawValue : 0;

  return `${(value * 100).toFixed(1)}%`;
}
