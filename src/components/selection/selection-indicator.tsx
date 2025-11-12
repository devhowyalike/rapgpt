"use client";

interface SelectionIndicatorProps {
  player: "P1" | "P2";
  variantIndex: number;
}

export function SelectionIndicator({ player, variantIndex }: SelectionIndicatorProps) {
  const isPlayer1 = player === "P1";
  
  return (
    <div
      className={`
        absolute top-0 right-0 z-20
        w-7 h-7 md:w-8 md:h-8 rounded-full
        flex items-center justify-center
        font-bold text-xs
        ${
          isPlayer1
            ? "bg-[rgb(var(--player1-color))] text-white shadow-[0_0_20px_rgba(var(--player1-color),0.8)]"
            : "bg-[rgb(var(--player2-color))] text-white shadow-[0_0_20px_rgba(var(--player2-color),0.8)]"
        }
      `}
    >
      {player}
      {variantIndex > 0 && (
        <span className="absolute -bottom-1 -right-1 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white/90" />
      )}
    </div>
  );
}

