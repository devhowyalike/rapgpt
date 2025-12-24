"use client";

import { Activity, Music, Radio, Swords, Trophy } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { MonthlyBattleStats } from "@/lib/usage-storage";
import { MonthSelector, type MonthOption } from "./month-selector";
import { StatCardGrid, type StatCardData } from "./stat-card";

interface MonthlyBattleStatsProps {
  stats: MonthlyBattleStats;
  availableMonths?: MonthOption[];
}

export function MonthlyBattleStatsComponent({
  stats,
  availableMonths = [],
}: MonthlyBattleStatsProps) {
  const statCards: StatCardData[] = [
    {
      label: "Total Battles",
      value: stats.totalBattles,
      icon: Swords,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
      borderColor: "border-cyan-500/30",
    },
    {
      label: "Live Broadcasts",
      value: stats.liveBattles,
      icon: Radio,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/30",
      description: "WebSocket sessions",
    },
    {
      label: "Completed",
      value: stats.completedBattles,
      icon: Trophy,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500/30",
    },
    {
      label: "AI Songs",
      value: stats.totalSongs,
      icon: Music,
      color: "text-pink-400",
      bgColor: "bg-pink-500/20",
      borderColor: "border-pink-500/30",
      description: "Suno MP3 generations",
    },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
            <Activity size={24} className="text-cyan-400" />
            Battle Stats - {stats.month} {stats.year}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Battle activity, live broadcasts, and AI song generations this month
          </p>
        </div>

        <MonthSelector
          availableMonths={availableMonths}
          selectedMonth={stats.month}
          selectedYear={stats.year}
          accentColor="cyan"
        />
      </div>

      <StatCardGrid stats={statCards} />

      {/* Summary text */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          {stats.totalBattles > 0 ? (
            <>
              <span className="text-white font-semibold">
                {formatNumber(stats.liveBattles)}
              </span>{" "}
              live broadcasts and{" "}
              <span className="text-pink-400 font-semibold">
                {formatNumber(stats.totalSongs)}
              </span>{" "}
              AI songs from{" "}
              <span className="text-white font-semibold">
                {formatNumber(stats.totalBattles)}
              </span>{" "}
              total battles this month
              {stats.completedBattles > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-amber-400 font-semibold">
                    {Math.round(
                      (stats.completedBattles / stats.totalBattles) * 100
                    )}
                    %
                  </span>{" "}
                  completion rate
                </>
              )}
            </>
          ) : (
            "No battles recorded for this month yet."
          )}
        </p>
      </div>
    </div>
  );
}
