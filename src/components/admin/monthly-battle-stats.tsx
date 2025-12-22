"use client";

import { Activity, ChevronDown, Radio, Swords, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MonthlyBattleStats } from "@/lib/usage-storage";

interface MonthlyBattleStatsProps {
  stats: MonthlyBattleStats;
  availableMonths?: { month: number; year: number; label: string }[];
}

export function MonthlyBattleStatsComponent({
  stats,
  availableMonths = [],
}: MonthlyBattleStatsProps) {
  const router = useRouter();

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const statCards = [
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
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    const [year, month] = value.split("-");
    router.push(`/admin/dashboard?year=${year}&month=${month}`);
  };

  const selectedValue = availableMonths.find(
    (m) => m.year === stats.year && m.label.startsWith(stats.month)
  );

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
            <Activity size={24} className="text-cyan-400" />
            WebSocket Stats - {stats.month} {stats.year}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Battle activity and live broadcast usage this month
          </p>
        </div>

        {availableMonths.length > 0 && (
          <div className="relative">
            <select
              className="appearance-none bg-gray-900 border border-cyan-500/30 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 pr-8 cursor-pointer"
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
        {statCards.map((stat) => {
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
              {"description" in stat && (
                <p className="text-gray-500 text-xs mt-1">{stat.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary text */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          {stats.totalBattles > 0 ? (
            <>
              <span className="text-white font-semibold">
                {formatNumber(stats.liveBattles)}
              </span>{" "}
              live WebSocket broadcasts out of{" "}
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
