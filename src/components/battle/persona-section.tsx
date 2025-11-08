/**
 * Persona section component
 * Wraps PersonaCard + VerseDisplay with consistent structure
 */

"use client";

import type { Persona, Verse, PersonaPosition } from "@/lib/shared";
import { PersonaCard } from "../persona-card";
import { VerseDisplay } from "../verse-display";
import { cn } from "@/lib/utils";

interface PersonaSectionProps {
  persona: Persona;
  verse: Verse | null;
  position: PersonaPosition;
  isActive?: boolean;
  isRoundWinner?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  mobileTopOffset?: number;
  visible?: boolean;
  /**
   * Custom padding for the persona card container
   * @default "p-3 md:p-4" for stage, "p-6" for replay
   */
  cardPadding?: string;
  /**
   * Enable sticky positioning on mobile
   * @default true
   */
  enableSticky?: boolean;
  /**
   * Is this the end of a battle (completed) vs end of a round (active battle)?
   * Used to determine the correct sticky offset height
   * @default false - assumes end of round in active battle
   */
  isBattleEnd?: boolean;
}

export function PersonaSection({
  persona,
  verse,
  position,
  isActive = false,
  isRoundWinner = false,
  isStreaming = false,
  streamingText,
  mobileTopOffset = 0,
  visible = true,
  cardPadding = "px-3 py-2 md:p-4",
  enableSticky = true,
  isBattleEnd = false,
}: PersonaSectionProps) {
  return (
    <div
      className={cn("flex flex-col md:min-h-0", !visible && "hidden md:flex")}
    >
      <div
        className={cn(
          cardPadding,
          "border-b border-gray-800",
          enableSticky && "persona-card-sticky",
          "bg-gray-900 z-10"
        )}
        style={
          enableSticky
            ? {
                top: isBattleEnd
                  ? "var(--mobile-battle-end-height)"
                  : "var(--mobile-round-end-height)",
              }
            : undefined
        }
      >
        <PersonaCard
          persona={persona}
          position={position}
          isActive={isActive}
          isRoundWinner={isRoundWinner}
        />
      </div>

      <div className="flex-1 stage-spotlight">
        <VerseDisplay
          verse={verse ?? undefined}
          persona={persona}
          position={position}
          isStreaming={isStreaming}
          streamingText={streamingText}
        />
      </div>
    </div>
  );
}
