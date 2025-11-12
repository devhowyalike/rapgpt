/**
 * Reusable component for displaying battle round scores
 * Used across battle-stage, battle-replay, and other battle views
 */

import type { Battle, RoundScore } from "@/lib/shared";
import { ScoreDisplay } from "../score-display";

interface BattleScoreSectionProps {
  battle: Battle;
  roundScore: RoundScore;
  className?: string;
}

export function BattleScoreSection({
  battle,
  roundScore,
  className = "",
}: BattleScoreSectionProps) {
  return (
    <ScoreDisplay
      roundScore={roundScore}
      player1Persona={battle.personas.player1}
      player2Persona={battle.personas.player2}
      votingEnabled={battle.votingEnabled ?? true}
      className={className}
    />
  );
}

