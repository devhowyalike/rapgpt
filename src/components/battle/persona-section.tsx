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
  cardPadding = "p-3 md:p-4",
}: PersonaSectionProps) {
  return (
    <div
      className={cn("flex flex-col md:min-h-0", !visible && "hidden md:flex")}
    >
      <div
        className={cn(
          cardPadding,
          "border-b border-gray-800",
          "persona-card-sticky",
          "bg-gray-900 z-10"
        )}
        style={
          mobileTopOffset > 0
            ? { top: `calc(${mobileTopOffset}px - var(--header-height))` }
            : { top: "calc(var(--header-height) - var(--header-height))" }
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
