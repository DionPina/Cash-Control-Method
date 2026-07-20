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
  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby="cash-control-summary-heading">
      <div className="rounded-3xl border border-[#decfb0] bg-[#fdfaf4] p-5 md:p-6 shadow-sm">
        <div className="mb-4 flex items-baseline justify-between gap-4 md:mb-5">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#7a6a48]">
              Snapshot
            </p>
<h2
  id="cash-control-summary-heading"
  className="mt-1 text-xl md:text-2xl font-semibold text-[#020b24]"
>
  Cash Control Summary
</h2>
          </div>
          <p className="hidden max-w-xs text-right text-[0.7rem] text-slate-600 md:block">
            At-a-glance numbers your future CFO self cares about.
          </p>
        </div>

        <div className="grid gap-3.5 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={index}
              className="rounded-2xl border border-[#decfb0] bg-[#f7f3ea] px-3.5 py-3 md:px-4 md:py-3.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs text-slate-700 md:text-sm">
                  {item.label}
                </p>
                {item.badge && (
                  <span className="inline-flex items-center rounded-full border border-[#38bdf8]/60 bg-[#e0f2fe] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#0f172a]">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-base font-semibold text-slate-900 md:text-lg">
                {formatDisplayValue(item)}
              </p>
              {item.helper && (
                <p className="mt-1 text-[0.7rem] leading-snug text-slate-600 md:text-xs">
                  {item.helper}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Formatting helpers */

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
