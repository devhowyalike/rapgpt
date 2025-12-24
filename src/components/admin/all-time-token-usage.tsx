"use client";

import { ArrowDownRight, ArrowUpRight, Coins, Zap } from "lucide-react";
import type {
  AllTimeTokenTotals,
  BattleTokenTotalsByModel,
} from "@/lib/usage-storage";

interface AllTimeTokenUsageProps {
  totals: AllTimeTokenTotals;
  byModel: BattleTokenTotalsByModel[];
}

export function AllTimeTokenUsage({ totals, byModel }: AllTimeTokenUsageProps) {
  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const dateRange =
    totals.firstUsageDate && totals.lastUsageDate
      ? `${formatDate(totals.firstUsageDate)} - ${formatDate(
          totals.lastUsageDate
        )}`
      : "since the beginning";

  const tokenStats = [
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
    <div className="space-y-8">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
            <Coins size={24} className="text-purple-400" />
            All Time Token Usage
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Total tokens consumed across all battles ({dateRange})
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tokenStats.map((stat) => {
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
                Used approximately{" "}
                <span className="text-white font-semibold">
                  {formatNumber(Math.round(totals.totalTokens / 1000))}K
                </span>{" "}
                tokens total.
              </>
            ) : (
              "No token usage recorded yet."
            )}
          </p>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <h2 className="font-bebas text-2xl text-white mb-4">Usage by Model</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-3 text-gray-400 font-medium">Model</th>
                <th className="pb-3 text-gray-400 font-medium">Provider</th>
                <th className="pb-3 text-gray-400 font-medium text-right">
                  Input
                </th>
                <th className="pb-3 text-gray-400 font-medium text-right">
                  Output
                </th>
                <th className="pb-3 text-gray-400 font-medium text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {byModel.map((model) => (
                <tr
                  key={`${model.provider}-${model.model}`}
                  className="hover:bg-gray-700/30"
                >
                  <td className="py-3 text-white font-mono">{model.model}</td>
                  <td className="py-3 text-gray-400">{model.provider}</td>
                  <td className="py-3 text-gray-300 text-right font-mono">
                    {formatNumber(model.inputTokens)}
                  </td>
                  <td className="py-3 text-gray-300 text-right font-mono">
                    {formatNumber(model.outputTokens)}
                  </td>
                  <td className="py-3 text-purple-300 text-right font-mono font-bold">
                    {formatNumber(model.totalTokens)}
                  </td>
                </tr>
              ))}
              {byModel.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No model usage data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
