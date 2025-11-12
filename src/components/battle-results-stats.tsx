import { Crown } from "lucide-react";

export interface BattleResultsStatsProps {
  winner: string | null | undefined;
  player1PersonaId: string;
  player1PersonaName: string;
  player2PersonaId: string;
  player2PersonaName: string;
  player1TotalScore: number;
  player2TotalScore: number;
  totalRounds: number;
}

export function BattleResultsStats({
  winner,
  player1PersonaId,
  player1PersonaName,
  player2PersonaId,
  player2PersonaName,
  player1TotalScore,
  player2TotalScore,
  totalRounds,
}: BattleResultsStatsProps) {
  const getWinnerName = () => {
    // If no winner, it's a tie
    if (!winner || winner === "tie") return "Tie";
    
    // If both personas have the same ID, determine winner by score
    if (player1PersonaId === player2PersonaId) {
      if (player1TotalScore > player2TotalScore) return player1PersonaName;
      if (player2TotalScore > player1TotalScore) return player2PersonaName;
      return "Tie";
    }
    
    // Normal case: different personas, match by ID
    if (winner === player1PersonaId) return player1PersonaName;
    if (winner === player2PersonaId) return player2PersonaName;
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
        • Final Score: {player1TotalScore} - {player2TotalScore}
      </li>
      <li>• {totalRounds} rounds completed</li>
    </ul>
  );
}

