import { Crown } from "lucide-react";

interface BattleResultsStatsProps {
  winner: string | null | undefined;
  leftPersonaId: string;
  leftPersonaName: string;
  rightPersonaId: string;
  rightPersonaName: string;
  leftTotalScore: number;
  rightTotalScore: number;
  totalRounds: number;
}

export function BattleResultsStats({
  winner,
  leftPersonaId,
  leftPersonaName,
  rightPersonaId,
  rightPersonaName,
  leftTotalScore,
  rightTotalScore,
  totalRounds,
}: BattleResultsStatsProps) {
  const getWinnerName = () => {
    if (winner === leftPersonaId) return leftPersonaName;
    if (winner === rightPersonaId) return rightPersonaName;
    if (winner) return winner;
    return "Tie";
  };

  const showCrown = winner && winner !== "tie";

  return (
    <ul className="text-sm text-gray-300 space-y-1">
      <li className="flex items-center gap-1">
        • Winner:{" "}
        <span className="text-green-400 font-semibold flex items-center gap-1">
          {getWinnerName()}
          {showCrown && <Crown size={14} className="inline text-yellow-400" />}
        </span>
      </li>
      <li>
        • Final Score: {leftTotalScore} - {rightTotalScore}
      </li>
      <li>• {totalRounds} rounds completed</li>
    </ul>
  );
}

