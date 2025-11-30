"use client";

import Image from "next/image";
import type { ClientPersona } from "@/lib/shared/personas/client";
import { SelectionIndicator } from "./selection-indicator";

interface PersonaGridItemProps {
  persona: ClientPersona;
  isSelected: boolean;
  isPlayer1: boolean;
  isPlayer2: boolean;
  showPlayer1Indicator: boolean;
  showPlayer2Indicator: boolean;
  player1VariantIndex: number;
  player2VariantIndex: number;
  isTouchDevice: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
}

export function PersonaGridItem({
  persona,
  isSelected,
  isPlayer1,
  isPlayer2,
  showPlayer1Indicator,
  showPlayer2Indicator,
  player1VariantIndex,
  player2VariantIndex,
  isTouchDevice,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
}: PersonaGridItemProps) {
  const showDeselect =
    isSelected && (showPlayer1Indicator || showPlayer2Indicator);
  const isActiveSelection =
    (isPlayer1 && showPlayer1Indicator) || (isPlayer2 && showPlayer2Indicator);

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      className={`
        relative group
        transition-all duration-300 transform
        hover:scale-105 md:hover:scale-110 hover:z-20
        ${isActiveSelection ? "scale-105 md:scale-110 z-10" : ""}
      `}
    >
      {/* Selection Indicators */}
      {showPlayer1Indicator && (
        <SelectionIndicator player="P1" variantIndex={player1VariantIndex} />
      )}
      {showPlayer2Indicator && (
        <SelectionIndicator player="P2" variantIndex={player2VariantIndex} />
      )}

      {/* Deselect Overlay */}
      {showDeselect && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 rounded-lg">
          <div className="text-center">
            <div className="text-white font-bold text-2xl md:text-3xl mb-1">
              ✕
            </div>
            <div className="text-white font-semibold text-xs uppercase">
              Deselect
            </div>
          </div>
        </div>
      )}

      {/* Character Portrait */}
      <div
        className={`
          w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28
          rounded-lg
          border-4
          overflow-hidden
          bg-linear-to-br from-gray-800 to-gray-900
          transition-all duration-300
          ${
            isActiveSelection
              ? isPlayer1 && showPlayer1Indicator
                ? "border-[rgb(var(--player1-color))] shadow-[0_0_30px_rgba(var(--player1-color),0.8)]"
                : "border-[rgb(var(--player2-color))] shadow-[0_0_30px_rgba(var(--player2-color),0.8)]"
              : "border-gray-700 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.5)]"
          }
        `}
      >
        <Image
          src={persona.avatar}
          alt={persona.name}
          width={112}
          height={112}
          className="w-full h-full object-cover"
        />
      </div>
    </button>
  );
}
