/**
 * Replay mode header for battle stage
 * Shows winner banner, creator attribution, and round navigation controls
 */

"use client";

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
          <CreatorAttribution
            battle={battle}
            hideOnMobileWhenWinnerVisible
            hideWhenCollapsed={isHeaderCollapsed}
          />
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
