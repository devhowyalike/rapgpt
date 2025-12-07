"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Coins,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MonthlyTokenTotals } from "@/lib/usage-storage";

interface MonthlyTokenUsageProps {
  totals: MonthlyTokenTotals;
  availableMonths?: { month: number; year: number; label: string }[];
}

export function MonthlyTokenUsage({
  totals,
  availableMonths = [],
}: MonthlyTokenUsageProps) {
  const router = useRouter();

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const stats = [
    {
      label: "Total Tokens",
      value: totals.totalTokens,
      icon: Coins,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30",
    },
    {
      label: "Input Tokens",
      value: totals.inputTokens,
      icon: ArrowDownRight,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
    },
    {
      label: "Output Tokens",
      value: totals.outputTokens,
      icon: ArrowUpRight,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
    },
    {
      label: "Cached Input",
      value: totals.cachedInputTokens,
      icon: Zap,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-500/30",
    },
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    const [year, month] = value.split("-");
    router.push(`/admin/dashboard?year=${year}&month=${month}`);
  };

  const currentSelection = `${totals.year}-${
    totals.month === "December"
      ? 12
      : new Date(`${totals.month} 1, 2000`).getMonth() + 1
  }`;
  // Actually totals.month is a string name (e.g. "December"), so constructing the value is tricky if we don't have the number.
  // But wait, totals object returned by getMonthlyTokenTotals has month as string name.
  // Let's rely on checking if the option label matches or something.
  // Better: The server knows the selected year/month, but here we only have the name.
  // We can reconstruct the value if we match the label.

  // Alternative: Pass selectedYear/selectedMonth as props.
  // Or just use the label for comparison if unique enough.

  // Let's refine the matching logic.
  // availableMonths has { month: number, year: number, label: string }
  // We can find the matching entry.

  const selectedValue = availableMonths.find(
    (m) => m.year === totals.year && m.label.startsWith(totals.month) // "December 2023" starts with "December"
  );

  // A safer way is to just assume the first one is selected if we can't find it, or empty.
  // Construct value as `year-month`

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
            <Coins size={24} className="text-purple-400" />
            Token Usage - {totals.month} {totals.year}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Total tokens consumed this month across all battles
          </p>
        </div>

        {availableMonths.length > 0 && (
          <div className="relative">
            <select
              className="appearance-none bg-gray-900 border border-purple-500/30 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 pr-8 cursor-pointer"
              onChange={handleMonthChange}
              value={
                selectedValue
                  ? `${selectedValue.year}-${selectedValue.month}`
                  : ""
              }
            >
              {availableMonths.map((m) => (
                <option
                  key={`${m.year}-${m.month}`}
                  value={`${m.year}-${m.month}`}
                >
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-lg p-4 transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-xs font-medium uppercase tracking-wide">
                  {stat.label}
                </span>
                <Icon size={16} className={stat.color} />
              </div>
              <div className={`${stat.color} font-bold text-2xl font-mono`}>
                {formatNumber(stat.value)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary text */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-400 text-sm">
          {totals.totalTokens > 0 ? (
            <>
              Using approximately{" "}
              <span className="text-white font-semibold">
                {formatNumber(Math.round(totals.totalTokens / 1000))}K
              </span>{" "}
              tokens with{" "}
              <span className="text-green-400 font-semibold">
                {formatNumber(totals.cachedInputTokens)}
              </span>{" "}
              cached tokens saved this month.
            </>
          ) : (
            "No token usage recorded for this month yet."
          )}
        </p>

        <Link
          href="/admin/usage"
          className="px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 text-xs rounded-md transition-colors flex items-center gap-2 border border-purple-500/20"
        >
          <Shield size={14} />
          All Time Usage
        </Link>
      </div>
    </div>
  );
}
