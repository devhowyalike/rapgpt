"use client";

import { ArrowDownRight, ArrowUpRight, Coins, Zap } from "lucide-react";
import type { MonthlyTokenTotals } from "@/lib/usage-storage";

interface MonthlyTokenUsageProps {
  totals: MonthlyTokenTotals;
}

export function MonthlyTokenUsage({ totals }: MonthlyTokenUsageProps) {
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

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
          <Coins size={24} className="text-purple-400" />
          Token Usage - {totals.month} {totals.year}
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Total tokens consumed this month across all battles
        </p>
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
      <div className="mt-4 pt-4 border-t border-gray-700">
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
      </div>
    </div>
  );
}
