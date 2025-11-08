/**
 * Battle split view component
 * Shared split-screen layout for displaying two personas side-by-side
 */

"use client";

import type { Battle, RoundScore, PersonaPosition } from "@/lib/shared";
import { PersonaSection } from "./persona-section";
import { cn } from "@/lib/utils";

interface BattleSplitViewProps {
  battle: Battle;
  /**
   * Verses to display for each persona
   */
  leftVerse: any;
  rightVerse: any;
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
  leftVerse,
  rightVerse,
  roundScore,
  showRoundWinner = false,
  mobileActiveSide = null,
  streamingPersonaId,
  streamingText,
  mobileTopOffset = 0,
  cardPadding = "p-3 md:p-4",
  className,
  contentClassName,
  style,
  enableStickyPersonas = true,
  isBattleEnd = false,
}: BattleSplitViewProps) {
  const leftVisible = mobileActiveSide === null || mobileActiveSide === "left";
  const rightVisible =
    mobileActiveSide === null || mobileActiveSide === "right";

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
          className={cn(
            "grid md:grid-cols-2 divide-y md:divide-y-0 divide-gray-800 md:min-h-full",
            contentClassName
          )}
        >
          {/* Left Persona */}
          <PersonaSection
            persona={battle.personas.left}
            verse={leftVerse}
            position="left"
            isActive={
              battle.currentTurn === "left" ||
              streamingPersonaId === battle.personas.left.id
            }
            isRoundWinner={
              showRoundWinner && roundScore?.winner === battle.personas.left.id
            }
            isStreaming={streamingPersonaId === battle.personas.left.id}
            streamingText={streamingText || undefined}
            mobileTopOffset={leftVisible ? mobileTopOffset : 0}
            visible={leftVisible}
            cardPadding={cardPadding}
            enableSticky={enableStickyPersonas}
            isBattleEnd={isBattleEnd}
          />

          {/* Right Persona */}
          <PersonaSection
            persona={battle.personas.right}
            verse={rightVerse}
            position="right"
            isActive={
              battle.currentTurn === "right" ||
              streamingPersonaId === battle.personas.right.id
            }
            isRoundWinner={
              showRoundWinner && roundScore?.winner === battle.personas.right.id
            }
            isStreaming={streamingPersonaId === battle.personas.right.id}
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
