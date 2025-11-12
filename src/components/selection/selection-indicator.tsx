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
            ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.8)]"
            : "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.8)]"
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

