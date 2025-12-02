/**
 * Display current battle state information (Round, Turn, Verses)
 */

import type { Battle } from "@/lib/shared";
import { getDisplayRound, ROUNDS_PER_BATTLE } from "@/lib/shared";

interface BattleStateInfoProps {
  battle: Battle;
  className?: string;
}

export function BattleStateInfo({ battle, className }: BattleStateInfoProps) {
  return (
    <div className={className}>
      <div className="flex justify-between">
        <span className="text-gray-400">Round:</span>
        <span className="text-white font-medium">
          {getDisplayRound(battle)}/{ROUNDS_PER_BATTLE}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Turn:</span>
        <span className="text-white font-medium">
          {battle.currentTurn
            ? battle.personas[battle.currentTurn].name
            : "Round Complete"}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Verses:</span>
        <span className="text-white font-medium">{battle.verses.length}</span>
      </div>
    </div>
  );
}
