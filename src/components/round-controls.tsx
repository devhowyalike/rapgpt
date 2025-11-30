"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ROUNDS_PER_BATTLE } from "@/lib/shared";

interface RoundControlsProps {
  selectedRound: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  compact?: boolean;
}

export function RoundControls({
  selectedRound,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  compact = false,
}: RoundControlsProps) {
  return (
    <div
      className={`flex items-center justify-center md:justify-start transition-all duration-300 ${
        compact ? "gap-2 md:gap-3" : "gap-3 md:gap-4"
      }`}
    >
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className={`rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
          compact ? "p-1.5 md:p-2" : "p-2"
        }`}
        title="Previous Round"
      >
        <ChevronLeft
          className={`text-white transition-all duration-300 ${
            compact ? "w-3 h-3 md:w-4 md:h-4" : "w-4 h-4 md:w-5 md:h-5"
          }`}
        />
      </button>
      <div
        className={`rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold font-(family-name:--font-bebas-neue) whitespace-nowrap transition-all duration-300 ${
          compact
            ? "px-3 py-1 md:px-4 md:py-1.5 text-sm md:text-base"
            : "px-4 py-1.5 md:px-6 md:py-2 text-lg md:text-xl"
        }`}
      >
        Round {selectedRound} of {ROUNDS_PER_BATTLE}
      </div>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
          compact ? "p-1.5 md:p-2" : "p-2"
        }`}
        title="Next Round"
      >
        <ChevronRight
          className={`text-white transition-all duration-300 ${
            compact ? "w-3 h-3 md:w-4 md:h-4" : "w-4 h-4 md:w-5 md:h-5"
          }`}
        />
      </button>
    </div>
  );
}
