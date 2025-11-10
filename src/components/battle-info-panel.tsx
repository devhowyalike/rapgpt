"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Stage } from "@/lib/shared/stages";
import { ROUNDS_PER_BATTLE, getDisplayRound } from "@/lib/shared";
import type { Battle } from "@/lib/shared";
import { BattleResultsStats } from "@/components/battle-results-stats";

interface BattleInfoPanelProps {
  type: "progress" | "results";
  createdAt: Date;
  stage: Stage;
  // Progress-specific props
  currentRound?: number;
  versesCount?: number;
  // Results-specific props
  resultsStats?: {
    winner: string | null | undefined;
    leftPersonaId: string;
    leftPersonaName: string;
    rightPersonaId: string;
    rightPersonaName: string;
    leftTotalScore: number;
    rightTotalScore: number;
    totalRounds: number;
  } | null;
}

export function BattleInfoPanel({
  type,
  createdAt,
  stage,
  currentRound,
  versesCount,
  resultsStats,
}: BattleInfoPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isProgress = type === "progress";
  const borderColor = isProgress
    ? "border-orange-500/20"
    : "border-green-500/20";
  const titleColor = isProgress ? "text-orange-400" : "text-green-400";
  const title = isProgress ? "Battle Progress" : "Battle Results";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <div className={`p-3 bg-gray-900/50 rounded-lg border ${borderColor}`}>
        {/* Collapsible trigger */}
        <CollapsibleTrigger className="w-full flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
          <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>
          <ChevronDown
            size={16}
            className={`${titleColor} transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>

        {/* All other content is collapsible */}
        <CollapsibleContent>
          <div className="space-y-2 mt-2">
            {/* Stage info */}
            <div className="text-xs text-gray-500">
              Stage: {stage.flag} {stage.name}, {stage.country}
            </div>

            {/* Battle details */}
            <div>
              {isProgress ? (
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>
                    • Round {getDisplayRound(currentRound || 1)} of{" "}
                    {ROUNDS_PER_BATTLE}
                  </li>
                  <li>
                    • {versesCount} {versesCount === 1 ? "verse" : "verses"}{" "}
                    completed
                  </li>
                </ul>
              ) : (
                resultsStats && <BattleResultsStats {...resultsStats} />
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
