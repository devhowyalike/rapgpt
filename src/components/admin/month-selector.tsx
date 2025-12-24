"use client";

import { ChevronDown } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export interface MonthOption {
  month: number;
  year: number;
  label: string;
}

interface MonthSelectorProps {
  availableMonths: MonthOption[];
  selectedMonth: string; // Month name like "December"
  selectedYear: number;
  accentColor?: string; // e.g., "purple", "pink"
  monthParam?: string;
  yearParam?: string;
}

export function MonthSelector({
  availableMonths,
  selectedMonth,
  selectedYear,
  accentColor = "purple",
  monthParam = "month",
  yearParam = "year",
}: MonthSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (availableMonths.length === 0) return null;

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    const [year, month] = value.split("-");

    // Use URLSearchParams to preserve other filters
    const params = new URLSearchParams(searchParams.toString());
    params.set(yearParam, year);
    params.set(monthParam, month);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Find the currently selected option
  const selectedValue = availableMonths.find(
    (m) => m.year === selectedYear && m.label.startsWith(selectedMonth)
  );

  const borderClass = `border-${accentColor}-500/30`;
  const focusRingClass = `focus:ring-${accentColor}-500`;
  const focusBorderClass = `focus:border-${accentColor}-500`;

  return (
    <div className="relative">
      <select
        className={`appearance-none bg-gray-900 border ${borderClass} text-white text-sm rounded-lg ${focusRingClass} ${focusBorderClass} block p-2.5 pr-8 cursor-pointer`}
        onChange={handleMonthChange}
        value={selectedValue ? `${selectedValue.year}-${selectedValue.month}` : ""}
      >
        {availableMonths.map((m) => (
          <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

