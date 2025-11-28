"use client";

import Image from "next/image";
import { Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ClientPersona } from "@/lib/shared/personas/client";

interface PlayerDisplayProps {
  player: ClientPersona | null;
  side: "left" | "right";
  showBio?: boolean;
  placeholder?: string;
  onActivate?: () => void;
  onClear?: () => void;
  isActive?: boolean;
}

export function PlayerDisplay({
  player,
  side,
  showBio = false,
  placeholder = "PLAYER",
  onActivate,
  onClear,
  isActive = false,
}: PlayerDisplayProps) {
  const isPlayer1 = side === "left";
  const borderColor = isPlayer1
    ? "border-[rgb(var(--player1-color))]"
    : "border-[rgb(var(--player2-color))]";
  const textColor = isPlayer1
    ? "text-[rgb(var(--player1-color))]/90"
    : "text-[rgb(var(--player2-color))]/90";
  const shadowColor = isPlayer1
    ? "rgba(var(--player1-color), 0.6)"
    : "rgba(var(--player2-color), 0.6)";
  const glowColor = isPlayer1
    ? "bg-[rgb(var(--player1-color))]/20"
    : "bg-[rgb(var(--player2-color))]/20";
  const dropShadowColor = isPlayer1
    ? "drop-shadow-[0_0_20px_rgba(var(--player1-color),0.8)]"
    : "drop-shadow-[0_0_20px_rgba(var(--player2-color),0.8)]";

  const content = (
    <div
      className={`flex-1 flex flex-col items-center justify-center h-[160px] md:h-[320px] group/player ${
        onActivate ? "cursor-pointer" : ""
      }`}
      onClick={onActivate}
      role={onActivate ? "button" : undefined}
      aria-pressed={onActivate ? (isActive ? "true" : "false") : undefined}
    >
      {player ? (
        <>
          {/* Character Style */}
          <p
            className={`${textColor} text-xs md:text-sm lg:text-base font-semibold mb-1 md:mb-2 shrink-0`}
          >
            {player.style}
          </p>
          {/* Large Character Portrait */}
          <div className="relative mb-1 md:mb-2 group shrink-0">
            <div
              className={`absolute inset-0 ${glowColor} blur-2xl rounded-full animate-pulse`}
            />
            {/* Edit button - positioned outside overflow container */}
            {onClear && (
              <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 z-10 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="peer w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-900 border border-gray-700 text-white text-xs md:text-sm font-bold shadow-lg group-hover/player:bg-gray-800 transition-all duration-200 group-hover/player:scale-110 flex items-center justify-center"
                  aria-label={`Edit ${isPlayer1 ? "Player 1" : "Player 2"}`}
                >
                  <Pencil className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>
            )}
            {/* Snake Ring Animation - Visible when active */}
            {isActive && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <svg
                  className="absolute inset-0 w-full h-full animate-[snake-ring_3s_linear_infinite]"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke={`rgb(var(--player${isPlayer1 ? "1" : "2"}-color))`}
                    strokeWidth="4"
                    strokeDasharray="75 225"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </svg>
              </div>
            )}
            <div
              className={`relative w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full border-4 md:border-6 ${
                isActive ? "border-transparent" : borderColor
              } overflow-hidden bg-linear-to-br from-gray-800 to-gray-900 shadow-2xl`}
              style={{
                boxShadow: `0 0 40px ${shadowColor}`,
              }}
            >
              <Image
                src={player.avatar}
                alt={player.name}
                width={144}
                height={144}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
          {/* Character Name */}
          <div
            className={`text-center text-sm md:text-2xl font-black text-white mb-1 tracking-tight md:tracking-wider ${dropShadowColor} text-balance uppercase leading-tight shrink-0 h-10 md:h-20 flex items-center justify-center`}
          >
            {player.name}
          </div>
          {/* Character Bio - always reserve space to prevent layout shift */}
          {showBio && (
            <div className="text-center max-w-xs flex flex-col md:h-16 shrink-0 text-pretty">
              <p className="text-gray-300 text-xs md:text-sm lg:text-base hidden md:block line-clamp-3">
                {player.bio}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Spacer to match style text height */}
          <p className="text-xs md:text-sm lg:text-base font-semibold mb-1 md:mb-2 opacity-0 shrink-0">
            Placeholder
          </p>
          <div
            className={`mb-1 md:mb-2 shrink-0 relative ${
              isActive ? "opacity-100" : "opacity-40"
            }`}
          >
            {/* Snake Ring Animation when active */}
            {isActive && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <svg
                  className="absolute inset-0 w-full h-full animate-[snake-ring_3s_linear_infinite]"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke={`rgb(var(--player${isPlayer1 ? "1" : "2"}-color))`}
                    strokeWidth="4"
                    strokeDasharray="75 225"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </svg>
              </div>
            )}
            <div className="w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full border-4 md:border-6 border-gray-700 border-dashed flex items-center justify-center text-3xl md:text-4xl lg:text-5xl text-gray-700">
              ?
            </div>
          </div>
          <div className="text-center text-sm md:text-xl lg:text-2xl font-black text-gray-700 tracking-tight md:tracking-wider mb-1 opacity-40 leading-tight shrink-0 h-10 md:h-20 flex items-center justify-center">
            {placeholder}
          </div>
          {/* Spacer to match bio height */}
          {showBio && <div className="text-center max-w-xs md:h-16 shrink-0" />}
        </>
      )}
    </div>
  );

  if (onClear) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={20}
            className="bg-black border-gray-800 text-white"
          >
            <p>Edit</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
