"use client";

import { Activity, Music, Radio, Swords, Trophy } from "lucide-react";
import type { AllTimeBattleStats } from "@/lib/usage-storage";

interface AllTimeBattleStatsProps {
  battleStats: AllTimeBattleStats;
}

export function AllTimeBattleStatsComponent({ battleStats }: AllTimeBattleStatsProps) {
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

  const battleDateRange =
    battleStats.firstBattleDate && battleStats.lastBattleDate
      ? `${formatDate(battleStats.firstBattleDate)} - ${formatDate(
          battleStats.lastBattleDate
        )}`
      : "since the beginning";

  const battleCardStats = [
    {
      label: "Total Battles",
      value: battleStats.totalBattles,
      icon: Swords,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
      borderColor: "border-cyan-500/30",
    },
    {
      label: "Live Broadcasts",
      value: battleStats.liveBattles,
      icon: Radio,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/30",
    },
    {
      label: "Completed",
      value: battleStats.completedBattles,
      icon: Trophy,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500/30",
    },
    {
      label: "AI Songs",
      value: battleStats.totalSongs,
      icon: Music,
      color: "text-pink-400",
      bgColor: "bg-pink-500/20",
      borderColor: "border-pink-500/30",
    },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
          <Activity size={24} className="text-cyan-400" />
          All Time Battle Stats
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Total battle activity and AI song generations ({battleDateRange})
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {battleCardStats.map((stat) => {
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
          {battleStats.totalBattles > 0 ? (
            <>
              Generated{" "}
              <span className="text-pink-400 font-semibold">
                {formatNumber(battleStats.totalSongs)}
              </span>{" "}
              AI songs from{" "}
              <span className="text-white font-semibold">
                {formatNumber(battleStats.totalBattles)}
              </span>{" "}
              total battles.
            </>
          ) : (
            "No battle data recorded yet."
          )}
        </p>
      </div>
    </div>
  );
}

