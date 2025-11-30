/**
 * Battle replay component for viewing completed battles
 * Displays battle content without bottom controls (handled by parent)
 */

"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useRoundData } from "@/lib/hooks/use-round-data";
import { useRoundNavigation } from "@/lib/hooks/use-round-navigation";
import type { Battle } from "@/lib/shared";
import { BattleHeader } from "./battle/battle-header";
import { BattleSplitView } from "./battle/battle-split-view";
import { CreatorAttribution } from "./creator-attribution";
import { RoundControls } from "./round-controls";
import { WinnerBanner } from "./winner-banner";

interface BattleReplayProps {
  battle: Battle;
  /**
   * Extra bottom padding for mobile to clear floating UI
   */
  mobileBottomPadding?: string;
}

export function BattleReplay({
  battle,
  mobileBottomPadding,
}: BattleReplayProps) {
  // Base mobile bottom padding to clear bottom controls (fan supplies its own)
  const mobileContentPadding = mobileBottomPadding ?? "0px";

  // Round navigation
  const {
    selectedRound,
    canGoPrev,
    canGoNext,
    handlePrevRound,
    handleNextRound,
  } = useRoundNavigation();

  const { verses: roundVerses, score: roundScore } = useRoundData(
    battle,
    selectedRound
  );
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Track scroll position to collapse header on mobile
  useEffect(() => {
    const scrollContainer = document.querySelector("[data-scroll-container]");
    if (!scrollContainer) return;

    // Do not collapse header on desktop; ensure it's expanded
    if (!isMobile) {
      setIsHeaderCollapsed(false);
      return;
    }

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      // Collapse after scrolling 50px (mobile only)
      setIsHeaderCollapsed(scrollTop > 50);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  return (
    <div className="flex flex-col min-h-0 md:h-full bg-linear-to-b from-stage-darker to-stage-dark">
      {/* Header with Replay Controls - Unified responsive layout */}
      <BattleHeader
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
            onPrev={handlePrevRound}
            onNext={handleNextRound}
            compact={isHeaderCollapsed}
          />
        </div>
      </BattleHeader>

      {/* Split Screen Stage */}
      <div
        data-scroll-container
        className="flex-1 overflow-y-auto pb-(--mobile-bottom-padding) xl:pb-0"
        style={{
          ["--mobile-bottom-padding" as string]: mobileContentPadding,
        }}
      >
        <BattleSplitView
          battle={battle}
          verses={roundVerses}
          roundScore={roundScore}
          showRoundWinner={true}
          cardPadding="px-3 py-2 md:p-4"
          isBattleEnd={true}
        />
      </div>
    </div>
  );
}
