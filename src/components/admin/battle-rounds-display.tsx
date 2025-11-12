"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Crown } from "lucide-react";
import type { Battle, Verse, Persona } from "@/lib/shared";
import { getWinnerPersonaId } from "@/lib/battle-position-utils";

interface BattleRoundsDisplayProps {
  battle: Battle;
}

export function BattleRoundsDisplay({ battle }: BattleRoundsDisplayProps) {
  const [expandedRounds, setExpandedRounds] = React.useState<Set<number>>(
    new Set()
  );

  // Group verses by round
  const versesByRound = React.useMemo(() => {
    const grouped = new Map<number, Verse[]>();
    for (const verse of battle.verses) {
      const roundVerses = grouped.get(verse.round) || [];
      roundVerses.push(verse);
      grouped.set(verse.round, roundVerses);
    }
    // Sort verses within each round by timestamp
    for (const [round, verses] of grouped.entries()) {
      verses.sort((a, b) => a.timestamp - b.timestamp);
    }
    return grouped;
  }, [battle.verses]);

  // Get sorted round numbers
  const roundNumbers = Array.from(versesByRound.keys()).sort((a, b) => a - b);

  const toggleRound = (round: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) {
        next.delete(round);
      } else {
        next.add(round);
      }
      return next;
    });
  };

  const getRoundWinner = (round: number): string | null => {
    const roundScore = battle.scores.find((s) => s.round === round);
    if (!roundScore) return null;
    return getWinnerPersonaId(battle, roundScore);
  };

  const getPersona = (personaId: string): Persona => {
    return personaId === battle.personas.player1.id
      ? battle.personas.player1
      : battle.personas.player2;
  };

  if (versesByRound.size === 0) {
    return (
      <p className="text-gray-400 text-center py-8">
        No verses have been generated yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {roundNumbers.map((round) => {
        const verses = versesByRound.get(round) || [];
        const isExpanded = expandedRounds.has(round);
        const roundWinner = getRoundWinner(round);

        return (
          <div
            key={round}
            className="bg-gray-700/30 border border-gray-600/50 rounded-lg overflow-hidden"
          >
            {/* Round Header - Clickable */}
            <button
              onClick={() => toggleRound(round)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <h3 className="text-white font-semibold text-lg">
                  Round {round}
                </h3>
                <span className="text-gray-500 text-sm">
                  ({verses.length} verse{verses.length !== 1 ? "s" : ""})
                </span>
              </div>
              {roundWinner && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Crown className="w-5 h-5 fill-yellow-400" />
                  <span className="text-sm font-semibold">
                    {getPersona(roundWinner).name} wins
                  </span>
                </div>
              )}
            </button>

            {/* Round Content - Collapsible */}
            {isExpanded && (
              <div className="border-t border-gray-600/50 p-4 space-y-3">
                {verses.map((verse) => {
                  const persona = getPersona(verse.personaId);
                  const isWinner = roundWinner === verse.personaId;

                  return (
                    <div
                      key={verse.id}
                      className="bg-gray-700/50 rounded-lg p-4 border-l-4 relative"
                      style={{ borderLeftColor: persona.accentColor }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={persona.avatar}
                            alt={persona.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span
                            className="font-semibold flex items-center gap-2"
                            style={{ color: persona.accentColor }}
                          >
                            {persona.name}
                            {isWinner && (
                              <Crown className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {new Date(verse.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {verse.fullText}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

