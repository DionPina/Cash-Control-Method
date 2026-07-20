"use client";

import { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

type Category = {
  id: string;
  label: string;
  value: number;
  placeholder: string;
};

type ExpenseCategoriesTotals = {
  totalCategories: number;
  averagePerWeek: number;
};

type ExpenseCategoriesProps = {
  onTotalsChange?: (totals: ExpenseCategoriesTotals) => void;
};

const initialCategories: Category[] = [
  { id: "food", label: "Food & groceries", value: 0, placeholder: "e.g. 250" },
  { id: "gas", label: "Gas & transport", value: 0, placeholder: "e.g. 120" },
  { id: "fun", label: "Fun & going out", value: 0, placeholder: "e.g. 100" },
  { id: "shopping", label: "Shopping & clothes", value: 0, placeholder: "e.g. 80" },
  { id: "subscriptions", label: "Subscriptions", value: 0, placeholder: "e.g. 40" },
  { id: "other", label: "Other variable", value: 0, placeholder: "e.g. 60" },
];

const parseNumber = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
};

export default function ExpenseCategories({
  onTotalsChange,
}: ExpenseCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const handleChange = (id: string, rawValue: string) => {
    const numeric = parseNumber(rawValue);
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, value: numeric } : cat
      )
    );
  };

  const totalCategories = categories.reduce(
    (sum, cat) => sum + cat.value,
    0
  );
  const averagePerWeek = totalCategories / 4 || 0;
  const hasData = totalCategories > 0;

  useEffect(() => {
    onTotalsChange?.({
      totalCategories,
      averagePerWeek,
    });
  }, [totalCategories, averagePerWeek, onTotalsChange]);

  const backgroundColors = [
    "#020b24", // navy
    "#6b4a2f", // brown
    "#d9c9aa", // tan
    "#4a6b4f", // muted green
    "#8c7853", // deeper brown
    "#c9ad7f", // light gold
  ];

  const chartData: ChartData<"doughnut"> = {
    labels: categories.map((c) => c.label),
    datasets: [
      {
        data: categories.map((c) => c.value),
        backgroundColor: backgroundColors,
        borderWidth: 0,
      },
    ],
  };

  const chartOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed || 0;
            const pct = totalCategories
              ? (value / totalCategories) * 100
              : 0;
            const label = context.label || "";
            return `${label}: $${value.toFixed(0)} (${pct.toFixed(1)}%)`;
          },
        },
      },
      datalabels: {
        color: "#f5f2ea",
        font: {
          size: 11,
          weight: "600",
        },
        formatter: (value: number) => {
          if (!totalCategories || !value) return "";
          const pct = (value / totalCategories) * 100;
          if (pct < 5) return ""; // hide tiny slivers
          return `${pct.toFixed(0)}%`;
        },
      },
    },
    cutout: "66%",
  };

  const formatCurrency = (value: number): string =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  return (
    <section
  id="categories"
  className="mx-auto max-w-5xl px-4 py-12 md:py-16 scroll-mt-24"
>
      <div className="rounded-3xl border border-[#decfb0] bg-[#fdfaf4] p-6 md:p-10 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#8c7853] uppercase">
          Step 3
        </p>
        <h2 className="text-2xl font-semibold md:text-3xl text-[#020b24]">
  Expense Categories &amp; Plan
</h2>
        <p className="mt-2 text-sm md:text-base text-[#6b4a2f] max-w-2xl">
          Break your variable spending into categories. The donut chart shows
          exactly where your planned cash is going, in both dollars and
          percentages.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)]">
          {/* Category inputs */}
          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-[#020b24]">
                    {cat.label}
                  </label>
                  {cat.value > 0 && (
                    <span className="text-xs text-[#8c7853]">
                      {formatCurrency(cat.value)}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={cat.placeholder}
                  onChange={(e) => handleChange(cat.id, e.target.value)}
                  className="w-full rounded-xl border border-[#d9cdb7] bg-[#f5f2ea] px-3 py-2.5 text-sm text-[#020b24] outline-none focus:border-[#6b4a2f] focus:ring-2 focus:ring-[#ebe0cf]"
                />
                {idx === 0 && (
                  <p className="text-xs text-[#8c7853]">
                    Use your real spending as a guide. This doesn&apos;t have to
                    be perfect—just honest.
                  </p>
                )}
              </div>
            ))}

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[#6b4a2f]">Total planned categories</span>
              <span className="font-semibold text-[#020b24]">
                {formatCurrency(totalCategories)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6b4a2f]">
                Average per week (4-week month)
              </span>
              <span className="font-semibold text-[#020b24]">
                {formatCurrency(averagePerWeek || 0)}
              </span>
            </div>
          </div>

          {/* Donut chart + legend */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-52 h-52 sm:w-64 sm:h-64">
              {hasData ? (
                <Doughnut data={chartData} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#8c7853] text-center px-6">
                  Add a few category amounts on the left to see the donut chart
                  fill in.
                </div>
              )}
            </div>

            <div className="w-full space-y-2 text-xs">
              {categories.map((cat, idx) => {
                if (!cat.value) return null;
                const pct = totalCategories
                  ? (cat.value / totalCategories) * 100
                  : 0;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            backgroundColors[idx % backgroundColors.length],
                        }}
                      />
                      <span className="text-[#6b4a2f]">{cat.label}</span>
                    </div>
                    <span className="text-[#020b24] font-medium">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
