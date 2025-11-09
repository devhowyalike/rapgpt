"use client";

import type { Battle } from "@/lib/shared";
import Link from "next/link";
import { User } from "lucide-react";

interface CreatorAttributionProps {
  battle: Battle;
  hideOnMobileWhenWinnerVisible?: boolean;
  hideWhenCollapsed?: boolean;
}

export function CreatorAttribution({
  battle,
  hideOnMobileWhenWinnerVisible = true,
  hideWhenCollapsed = false,
}: CreatorAttributionProps) {
  if (!battle.creator) return null;

  const hideOnMobile = hideOnMobileWhenWinnerVisible && Boolean(battle.winner);

  return (
    <Link
      href={`/profile/${battle.creator.userId}`}
      className={`inline-flex items-center gap-1.5 text-gray-400 hover:text-blue-400 transition-all duration-300 ${
        hideOnMobile ? "hidden md:inline-flex" : ""
      } ${hideWhenCollapsed ? "text-xs md:gap-1" : "text-sm md:gap-2"}`}
    >
      <User
        className={`transition-all duration-300 ${
          hideWhenCollapsed ? "w-3 h-3" : "w-4 h-4"
        }`}
      />
      <span>Created by {battle.creator.displayName}</span>
    </Link>
  );
}
