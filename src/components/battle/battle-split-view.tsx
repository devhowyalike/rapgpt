/**
 * Battle split view component
 * Shared split-screen layout for displaying two personas side-by-side
 */

"use client";

import type { Battle, PersonaPosition, RoundScore } from "@/lib/shared";
import { cn } from "@/lib/utils";
import { PersonaSection } from "./persona-section";

interface BattleSplitViewProps {
  battle: Battle;
  /**
   * Verses to display for each persona
   */
  verses: {
    player1: any;
    player2: any;
  };
  /**
   * Round score for winner badges
   */
  roundScore?: RoundScore;
  /**
   * Whether to show round winner badge on personas
   */
  showRoundWinner?: boolean;
  /**
   * Control which side is visible on mobile
   * null = show both sides
   */
  mobileActiveSide?: PersonaPosition | null;
  /**
   * Streaming state for live battles
   */
  streamingPersonaId?: string | null;
  streamingText?: string | null;
  streamingPosition?: PersonaPosition | null;
  /**
   * Mobile top offset for first persona (to avoid sticky header overlap)
   */
  mobileTopOffset?: number;
  /**
   * Custom padding for persona cards
   * @default "p-3 md:p-4"
   */
  cardPadding?: string;
  /**
   * Additional wrapper classes
   */
  className?: string;
  /**
   * Additional content wrapper classes (for scroll behavior, padding, etc.)
   */
  contentClassName?: string;
  /**
   * Inline styles for content wrapper
   */
  style?: React.CSSProperties;
  /**
   * Enable sticky positioning on persona cards (mobile only)
   * @default true
   */
  enableStickyPersonas?: boolean;
  /**
   * Is this the end of a battle (completed) vs end of a round (active battle)?
   * Used to determine the correct sticky offset height
   * @default false - assumes end of round in active battle
   */
  isBattleEnd?: boolean;
}

export function BattleSplitView({
  battle,
  verses,
  roundScore,
  showRoundWinner = false,
  mobileActiveSide = null,
  streamingPersonaId,
  streamingText,
  streamingPosition,
  mobileTopOffset = 0,
  cardPadding = "p-3 md:p-4",
  className,
  contentClassName,
  style,
  enableStickyPersonas = true,
  isBattleEnd = false,
}: BattleSplitViewProps) {
  const leftVisible =
    mobileActiveSide === null || mobileActiveSide === "player1";
  const rightVisible =
    mobileActiveSide === null || mobileActiveSide === "player2";

  return (
    <>
      <div
        className={cn("relative max-w-7xl mx-auto md:min-h-full", className)}
        style={style}
      >
        {/* Full-height center divider on desktop */}
        <div
          className="hidden md:block pointer-events-none absolute inset-y-0 left-1/2 w-px bg-gray-800 z-20"
          aria-hidden="true"
        />

        <div
          className={cn("grid md:grid-cols-2 md:min-h-full", contentClassName)}
        >
          {/* Player 1 (Left Side) */}
          <PersonaSection
            persona={battle.personas.player1}
            verse={verses.player1}
            position="player1"
            isActive={
              battle.currentTurn === "player1" ||
              streamingPosition === "player1"
            }
            isRoundWinner={showRoundWinner && roundScore?.winner === "player1"}
            isStreaming={streamingPosition === "player1"}
            streamingText={streamingText || undefined}
            mobileTopOffset={leftVisible ? mobileTopOffset : 0}
            visible={leftVisible}
            cardPadding={cardPadding}
            enableSticky={enableStickyPersonas}
            isBattleEnd={isBattleEnd}
          />

          {/* Player 2 (Right Side) */}
          <PersonaSection
            persona={battle.personas.player2}
            verse={verses.player2}
            position="player2"
            isActive={
              battle.currentTurn === "player2" ||
              streamingPosition === "player2"
            }
            isRoundWinner={showRoundWinner && roundScore?.winner === "player2"}
            isStreaming={streamingPosition === "player2"}
            streamingText={streamingText || undefined}
            mobileTopOffset={rightVisible ? mobileTopOffset : 0}
            visible={rightVisible}
            cardPadding={cardPadding}
            enableSticky={enableStickyPersonas}
            isBattleEnd={isBattleEnd}
          />
        </div>
      </div>
    </>
  );
}
