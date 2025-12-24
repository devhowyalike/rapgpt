"use client";

import type { LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/format";

export interface StatCardData {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  isLive?: boolean;
  description?: string;
  /** Custom formatter for this specific stat's value */
  formatValue?: (value: number | string) => string;
}

interface StatCardProps {
  stat: StatCardData;
  /** Global formatter - stat's own formatValue takes precedence */
  formatValue?: (value: number | string) => string;
}

export function StatCard({ stat, formatValue }: StatCardProps) {
  const Icon = stat.icon;

  // Priority: stat's own formatter > global formatter > default
  const formatter = stat.formatValue ?? formatValue;
  const displayValue = formatter
    ? formatter(stat.value)
    : typeof stat.value === "number"
    ? formatNumber(stat.value)
    : stat.value;

  return (
    <div
      className={`${stat.bgColor} border ${stat.borderColor} rounded-lg p-4 transition-all hover:scale-105 relative`}
    >
      {stat.isLive && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300 text-xs font-medium uppercase tracking-wide">
          {stat.label}
        </span>
        <Icon size={16} className={stat.color} />
      </div>
      <div className={`${stat.color} font-bold text-2xl font-mono`}>
        {displayValue}
      </div>
      {stat.description && (
        <p className="text-gray-500 text-xs mt-1">{stat.description}</p>
      )}
    </div>
  );
}

interface StatCardGridProps {
  stats: StatCardData[];
  /** Global formatter applied to all stats (stat's own formatValue takes precedence) */
  formatValue?: (value: number | string) => string;
}

export function StatCardGrid({ stats, formatValue }: StatCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} formatValue={formatValue} />
      ))}
    </div>
  );
}
