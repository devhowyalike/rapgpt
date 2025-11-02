"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface RoundControlsProps {
  selectedRound: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function RoundControls({
  selectedRound,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: RoundControlsProps) {
  return (
    <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4">
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="Previous Round"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </button>
      <div className="px-4 py-1.5 md:px-6 md:py-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold font-(family-name:--font-bebas-neue) text-lg md:text-xl whitespace-nowrap">
        Round {selectedRound} of 3
      </div>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="Next Round"
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </button>
    </div>
  );
}
