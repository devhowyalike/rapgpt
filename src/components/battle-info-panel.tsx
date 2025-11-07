"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Stage } from "@/lib/shared/stages";
import { BattleMetadata } from "@/components/battle-metadata";
import { BattleFeatureBadges } from "@/components/battle-feature-badges";
import { BattleResultsStats } from "@/components/battle-results-stats";

interface BattleInfoPanelProps {
  type: "progress" | "results";
  createdAt: Date;
  stage: Stage;
  featureBadges: {
    votingEnabled?: boolean;
    commentsEnabled?: boolean;
    hasGeneratedSong: boolean;
  };
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
  featureBadges,
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
        <BattleMetadata createdAt={createdAt} stage={stage} />
        <div className="flex flex-col gap-2 mb-2">
          <BattleFeatureBadges {...featureBadges} />
          <CollapsibleTrigger className="flex items-center gap-1 cursor-pointer">
            <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>
            <ChevronDown
              size={16}
              className={`${titleColor} transform transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
        </div>
        {/* Collapsible content across all breakpoints */}
        <CollapsibleContent>
          <div className="mt-2">
            {isProgress ? (
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Round {currentRound} of 3</li>
                <li>
                  • {versesCount} {versesCount === 1 ? "verse" : "verses"}{" "}
                  completed
                </li>
              </ul>
            ) : (
              resultsStats && <BattleResultsStats {...resultsStats} />
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
