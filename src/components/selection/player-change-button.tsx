import Image from "next/image";
import type { ClientPersona } from "@/lib/shared/personas/client";

interface PlayerChangeButtonProps {
  player: ClientPersona;
  playerNumber: 1 | 2;
  sessionStorageKey: string;
  onBack: () => void;
}

export function PlayerChangeButton({
  player,
  playerNumber,
  sessionStorageKey,
  onBack,
}: PlayerChangeButtonProps) {
  const handleClick = () => {
    try {
      const stored = sessionStorage.getItem(sessionStorageKey);
      const selections = stored ? JSON.parse(stored) : {};
      selections.selectionStep = playerNumber === 1 ? "player1" : "player2";
      selections.showStageSelect = false;
      selections.editPlayer = true;
      selections.fromStage = true;
      sessionStorage.setItem(sessionStorageKey, JSON.stringify(selections));
    } catch {}
    onBack();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex flex-col items-center gap-1.5 group"
      title={`Change Player ${playerNumber}`}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-gray-700 shadow-lg transition-all group-hover:border-gray-500 group-hover:scale-105">
        <Image
          src={player.avatar}
          alt={player.name}
          width={56}
          height={56}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="px-3 py-1 rounded-full text-xs md:text-sm font-semibold bg-gray-800 text-gray-200 border border-gray-700 group-hover:bg-gray-700 transition-colors">
        Change P{playerNumber}
      </div>
    </button>
  );
}

