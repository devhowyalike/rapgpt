/**
 * Replay mode header for battle stage
 * Shows winner banner, creator attribution, "was live" badge, and round navigation controls
 */

"use client";

import { Radio } from "lucide-react";
import type { Battle } from "@/lib/shared";
import { CreatorAttribution } from "../creator-attribution";
import { RoundControls } from "../round-controls";
import { WinnerBanner } from "../winner-banner";
import { BattleHeader } from "./battle-header";

interface BattleStageReplayHeaderProps {
  battle: Battle;
  isHeaderCollapsed: boolean;
  selectedRound: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrevRound: () => void;
  onNextRound: () => void;
}

export function BattleStageReplayHeader({
  battle,
  isHeaderCollapsed,
  selectedRound,
  canGoPrev,
  canGoNext,
  onPrevRound,
  onNextRound,
}: BattleStageReplayHeaderProps) {
  return (
    <BattleHeader
      sticky={false}
      variant="blur"
      className="md:bg-transparent md:backdrop-blur-none transition-all duration-300"
      compact={isHeaderCollapsed}
    >
      <div
        className={`transition-all duration-300 ${
          isHeaderCollapsed
            ? "flex flex-row items-center justify-between gap-2 md:flex-row md:gap-3"
            : "flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-8"
        }`}
      >
        {/* Left Side: Winner/Paused and Creator */}
        <div
          className={`shrink-0 flex flex-col items-center md:items-start transition-all duration-300 ${
            isHeaderCollapsed ? "gap-0" : "gap-2"
          }`}
        >
          <WinnerBanner battle={battle} collapsed={isHeaderCollapsed} />
          <div
            className={`flex items-center gap-2 transition-all duration-300 ${
              isHeaderCollapsed ? "gap-1" : "gap-2"
            }`}
          >
            <CreatorAttribution
              battle={battle}
              hideOnMobileWhenWinnerVisible
              hideWhenCollapsed={isHeaderCollapsed}
            />
            {/* "Was Live" badge - shown for battles that were formerly live */}
            {battle.liveStartedAt && !battle.isLive && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 transition-all duration-300 ${
                  isHeaderCollapsed
                    ? "text-[10px] hidden md:inline-flex"
                    : "text-xs"
                } ${battle.winner ? "hidden md:inline-flex" : ""}`}
                title={`Originally broadcast live on ${new Date(battle.liveStartedAt).toLocaleDateString()}`}
              >
                <Radio
                  className={`transition-all duration-300 ${
                    isHeaderCollapsed ? "w-2.5 h-2.5" : "w-3 h-3"
                  }`}
                />
                <span>Was Live</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Round Controls */}
        <RoundControls
          selectedRound={selectedRound}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={onPrevRound}
          onNext={onNextRound}
          compact={isHeaderCollapsed}
        />
      </div>
    </BattleHeader>
  );
}
