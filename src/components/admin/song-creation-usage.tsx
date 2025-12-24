"use client";

import {
  Music,
  Coins,
  CreditCard,
  Wallet,
  AlertCircle,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { formatNumber, formatCurrency } from "@/lib/format";
import type { SongCreationTotals } from "@/lib/usage-storage";
import { MonthSelector, type MonthOption } from "./month-selector";
import { StatCardGrid, type StatCardData } from "./stat-card";

interface SongCreationUsageProps {
  totals: SongCreationTotals;
  sunoCredits: { credits: number; error?: string };
  /** For monthly view - if provided, shows month selector */
  month?: string;
  year?: number;
  availableMonths?: MonthOption[];
  monthParam?: string;
  yearParam?: string;
}

export function SongCreationUsage({
  totals,
  sunoCredits,
  month,
  year,
  availableMonths = [],
  monthParam = "month",
  yearParam = "year",
}: SongCreationUsageProps) {
  const hasError = !!sunoCredits.error;
  const isMonthlyView = !!month && !!year;

  const songStats: StatCardData[] = [
    {
      label: "Suno Account Balance",
      value: hasError ? 0 : sunoCredits.credits,
      icon: Wallet,
      color: hasError ? "text-gray-400" : "text-green-400",
      bgColor: hasError ? "bg-gray-500/20" : "bg-green-500/20",
      borderColor: hasError ? "border-gray-500/30" : "border-green-500/30",
      isLive: !hasError,
      formatValue: hasError ? () => "—" : undefined,
    },
    {
      label: isMonthlyView ? "Songs This Month" : "Total Songs",
      value: totals.totalSongs,
      icon: Music,
      color: "text-pink-400",
      bgColor: "bg-pink-500/20",
      borderColor: "border-pink-500/30",
    },
    {
      label: isMonthlyView ? "Credits This Month" : "Credits Used",
      value: totals.totalCredits,
      icon: Coins,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500/30",
    },
    {
      label: "Est. Cost",
      value: totals.totalCredits,
      icon: CreditCard,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
      borderColor: "border-cyan-500/30",
      formatValue: (v) => formatCurrency(Number(v) * 0.1),
    },
  ];

  const title = isMonthlyView
    ? `Song Credits - ${month} ${year}`
    : "Song Creation Credits";

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-pink-500/20 rounded-lg p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
            <Music size={24} className="text-pink-400" />
            {title}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Live Suno API balance and {isMonthlyView ? "monthly" : "all-time"}{" "}
            tracked usage
          </p>
        </div>

        {availableMonths.length > 0 && month && year && (
          <MonthSelector
            availableMonths={availableMonths}
            selectedMonth={month}
            selectedYear={year}
            accentColor="pink"
            monthParam={monthParam}
            yearParam={yearParam}
          />
        )}
      </div>

      <StatCardGrid stats={songStats} />

      {/* Status messages */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        {hasError ? (
          <p className="text-amber-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            Could not fetch Suno account balance: {sunoCredits.error}
          </p>
        ) : (
          <p className="text-gray-400 text-sm">
            Your Suno account has{" "}
            <span className="text-green-400 font-semibold">
              {formatNumber(sunoCredits.credits)}
            </span>{" "}
            credits remaining.
            {totals.totalSongs > 0 && (
              <>
                {" "}
                {isMonthlyView ? "This month:" : "All-time:"}{" "}
                <span className="text-pink-400 font-semibold">
                  {formatNumber(totals.totalSongs)}
                </span>{" "}
                song{totals.totalSongs !== 1 ? "s" : ""} tracked.
              </>
            )}
          </p>
        )}

        {isMonthlyView && (
          <Link
            href="/admin/usage/songs"
            className="px-3 py-1.5 bg-pink-900/30 hover:bg-pink-900/50 text-pink-300 text-xs rounded-md transition-colors flex items-center gap-2 border border-pink-500/20"
          >
            <Shield size={14} />
            All Time Usage
          </Link>
        )}
      </div>
    </div>
  );
}
