"use client";

import Image from "next/image";
import type { ClientPersona } from "@/lib/shared/personas/client";

interface PlayerDisplayProps {
  player: ClientPersona | null;
  side: "left" | "right";
  showBio?: boolean;
  placeholder?: string;
}

export function PlayerDisplay({
  player,
  side,
  showBio = false,
  placeholder = "PLAYER",
}: PlayerDisplayProps) {
  const isLeft = side === "left";
  const colorClass = isLeft ? "blue" : "red";
  const borderColor = isLeft ? "border-blue-500" : "border-red-500";
  const textColor = isLeft ? "text-blue-400" : "text-red-400";
  const shadowColor = isLeft
    ? "rgba(59, 130, 246, 0.6)"
    : "rgba(239, 68, 68, 0.6)";
  const glowColor = isLeft
    ? "bg-blue-500/20"
    : "bg-red-500/20";
  const dropShadowColor = isLeft
    ? "drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]"
    : "drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]";

  return (
    <div className="flex-1 flex flex-col items-center justify-start min-h-[180px] md:min-h-[280px] lg:min-h-[320px]">
      {player ? (
        <>
          {/* Character Style */}
          <p className={`${textColor} text-xs md:text-sm lg:text-base font-semibold mb-2`}>
            Style: {player.style}
          </p>
          {/* Large Character Portrait */}
          <div className="relative mb-2 group">
            <div className={`absolute inset-0 ${glowColor} blur-2xl rounded-full animate-pulse`} />
            <div
              className={`relative w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full border-4 md:border-6 ${borderColor} overflow-hidden bg-linear-to-br from-gray-800 to-gray-900 shadow-2xl`}
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
          <div className={`text-center min-h-[48px] md:min-h-0 text-sm md:text-2xl lg:text-3xl font-black text-white mb-1 tracking-tight md:tracking-wider ${dropShadowColor} text-balance uppercase`}>
            {player.name}
          </div>
          {/* Character Bio */}
          {showBio && (
            <div className="text-center max-w-xs mb-1 flex flex-col md:min-h-[60px]">
              <p className="text-gray-300 text-xs md:text-sm lg:text-base hidden md:block">
                {player.bio}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Spacer to match style text height */}
          <p className="text-xs md:text-sm lg:text-base font-semibold mb-2 opacity-0">
            Style: Placeholder
          </p>
          <div className="opacity-40 mb-2">
            <div className="w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full border-4 md:border-6 border-gray-700 border-dashed flex items-center justify-center text-3xl md:text-4xl lg:text-5xl text-gray-700">
              ?
            </div>
          </div>
          <div className="text-center min-h-[48px] md:min-h-0 text-sm md:text-xl lg:text-2xl font-black text-gray-700 tracking-tight md:tracking-wider mb-1 opacity-40">
            {placeholder}
          </div>
          {/* Spacer to match bio height */}
          {showBio && <div className="text-center max-w-xs mb-1 md:min-h-[60px]" />}
        </>
      )}
    </div>
  );
}

