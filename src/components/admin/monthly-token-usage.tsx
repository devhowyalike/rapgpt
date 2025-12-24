"use client";

import { ArrowDownRight, ArrowUpRight, Coins, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { formatNumber, formatCompact } from "@/lib/format";
import type { MonthlyTokenTotals } from "@/lib/usage-storage";
import { MonthSelector, type MonthOption } from "./month-selector";
import { StatCardGrid, type StatCardData } from "./stat-card";

interface MonthlyTokenUsageProps {
  totals: MonthlyTokenTotals;
  availableMonths?: MonthOption[];
  monthParam?: string;
  yearParam?: string;
}

export function MonthlyTokenUsage({
  totals,
  availableMonths = [],
  monthParam = "month",
  yearParam = "year",
}: MonthlyTokenUsageProps) {
  const stats: StatCardData[] = [
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

        <MonthSelector
          availableMonths={availableMonths}
          selectedMonth={totals.month}
          selectedYear={totals.year}
          accentColor="purple"
          monthParam={monthParam}
          yearParam={yearParam}
        />
      </div>

      <StatCardGrid stats={stats} />

      {/* Summary text */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-400 text-sm">
          {totals.totalTokens > 0 ? (
            <>
              Using approximately{" "}
              <span className="text-white font-semibold">
                {formatCompact(totals.totalTokens)}
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
          href="/admin/usage/tokens"
          className="px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 text-xs rounded-md transition-colors flex items-center gap-2 border border-purple-500/20"
        >
          <Shield size={14} />
          All Time Usage
        </Link>
      </div>
    </div>
  );
}
