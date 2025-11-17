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

// Register chart.js pieces & the datalabels plugin
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

type CategoryTotals = {
  totalCategories: number;
  averagePerWeek: number;
};

type ExpenseCategoriesProps = {
  onTotalsChange?: (totals: CategoryTotals) => void;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

export default function ExpenseCategories({
  onTotalsChange,
}: ExpenseCategoriesProps) {
  const [housing, setHousing] = useState("");
  const [food, setFood] = useState("");
  const [transportation, setTransportation] = useState("");
  const [school, setSchool] = useState("");
  const [personal, setPersonal] = useState("");
  const [fun, setFun] = useState("");
  const [other, setOther] = useState("");

  const toNumber = (value: string) => Number(value.replace(/,/g, "")) || 0;

  const categories = [
    { label: "Housing", value: toNumber(housing) },
    { label: "Food", value: toNumber(food) },
    { label: "Transportation", value: toNumber(transportation) },
    { label: "School", value: toNumber(school) },
    { label: "Personal", value: toNumber(personal) },
    { label: "Fun", value: toNumber(fun) },
    { label: "Other", value: toNumber(other) },
  ];

  const totalCategories = categories.reduce((sum, cat) => sum + cat.value, 0);
  const averagePerWeek = totalCategories / 4 || 0;
  const hasData = totalCategories > 0;

  // Notify parent (page.tsx) when totals change
  useEffect(() => {
    onTotalsChange?.({
      totalCategories,
      averagePerWeek,
    });
  }, [totalCategories, averagePerWeek, onTotalsChange]);

  const chartData: ChartData<"doughnut"> = {
    labels: categories.map((c) => c.label),
    datasets: [
      {
        data: categories.map((c) => c.value),
        backgroundColor: [
          "#020617", // slate-950
          "#0f172a", // slate-900
          "#1d4ed8", // blue-700
          "#0ea5e9", // sky-500
          "#22c55e", // green-500
          "#f97316", // orange-500
          "#6366f1", // indigo-500
        ],
        borderColor: "#e5e7eb",
        borderWidth: 1,
      },
    ],
  };
    const backgroundColors =
    chartData.datasets[0].backgroundColor as string[] | undefined;

  const chartOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || "";
            const value = ctx.parsed as number;
            const total = totalCategories || 1;
            const pct = (value / total) * 100;
            return `${label}: ${formatCurrency(value)} (${pct.toFixed(0)}%)`;
          },
        },
      },
      // show percentages on the chart
      datalabels: {
        color: "#ffffff",
        font: {
          weight: "bold",
        },
        formatter: (value, context) => {
          const dataArray =
            (context.chart.data.datasets?.[0]?.data as number[]) || [];
          const total =
            dataArray.reduce((sum, val) => sum + (val || 0), 0) || 0;
          if (!total || !value) return "";
          const pct = (Number(value) / total) * 100;
          return `${pct.toFixed(0)}%`;
        },
      },
    },
    cutout: "65%",
  };

  const handleInputChange =
    (setter: (value: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
    };

  return (
    <section id="categories" className="mx-auto max-w-5xl px-4 py-12 md:py-16">
      <div className="rounded-2xl bg-white p-6 shadow-sm md:p-10 border border-slate-200">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Left: inputs */}
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Step 3
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold mb-2 text-slate-900">
              Expense Categories
            </h2>
            <p className="text-sm md:text-base text-slate-700 mb-6">
              Break your monthly spending into simple categories. This mirrors
              how you&apos;ll track things in your spreadsheet: clear buckets
              instead of a million tiny rules.
            </p>

            <div className="space-y-4">
              <CategoryInput
                label="Housing"
                helper="Rent, utilities, internet, etc."
                value={housing}
                onChange={handleInputChange(setHousing)}
              />
              <CategoryInput
                label="Food"
                helper="Groceries, eating out, campus snacks."
                value={food}
                onChange={handleInputChange(setFood)}
              />
              <CategoryInput
                label="Transportation"
                helper="Gas, rideshare, bus pass, parking."
                value={transportation}
                onChange={handleInputChange(setTransportation)}
              />
              <CategoryInput
                label="School"
                helper="Books, fees, supplies, software."
                value={school}
                onChange={handleInputChange(setSchool)}
              />
              <CategoryInput
                label="Personal"
                helper="Clothes, hygiene, subscriptions."
                value={personal}
                onChange={handleInputChange(setPersonal)}
              />
              <CategoryInput
                label="Fun"
                helper="Hobbies, going out, games, trips."
                value={fun}
                onChange={handleInputChange(setFun)}
              />
              <CategoryInput
                label="Other"
                helper="Anything that doesn&apos;t fit above."
                value={other}
                onChange={handleInputChange(setOther)}
              />
            </div>
          </div>

          {/* Right: summary + donut chart */}
          <div className="flex flex-col">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Category summary
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Total across all categories:{" "}
                <span className="font-semibold">
                  {formatCurrency(totalCategories)}
                </span>
                <br />
                Average per week in categories:{" "}
                <span className="font-semibold">
                  {formatCurrency(averagePerWeek)}
                </span>
              </p>

              <div className="relative h-52 md:h-64 mb-6">
                {hasData ? (
                  <Doughnut data={chartData} options={chartOptions} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-center text-xs md:text-sm text-slate-500 px-6">
                    Start entering amounts on the left to see your spending
                    breakdown here. Use it as a quick check against your
                    variable budget in Step 1.
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-700">
                {categories.map((cat, idx) => (
                  <div key={cat.label} className="flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{
                        backgroundColor: backgroundColors?.[idx] ?? "#0f172a"
                      }}
                    />
                    <span>{cat.label}</span>
                    {totalCategories > 0 && cat.value > 0 && (
                      <span className="text-slate-500">
                        {(
                          (cat.value / totalCategories) *
                          100
                        ).toFixed(0)}
                        %
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                <span className="font-semibold">Tip:</span> If your category
                total is higher than your variable budget from Step 1,
                you&apos;re planning to overspend and should adjust one of them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type CategoryInputProps = {
  label: string;
  helper: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function CategoryInput({ label, helper, value, onChange }: CategoryInputProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          {label}
        </label>
        <span className="text-[11px] font-medium tracking-wide text-slate-500">
          MONTHLY
        </span>
      </div>
      <input
        type="text"
        inputMode="decimal"
        placeholder="e.g. 450"
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}
