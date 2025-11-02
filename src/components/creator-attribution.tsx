"use client";

import type { Battle } from "@/lib/shared";
import Link from "next/link";
import { User } from "lucide-react";

interface CreatorAttributionProps {
  battle: Battle;
  hideOnMobileWhenWinnerVisible?: boolean;
}

export function CreatorAttribution({
  battle,
  hideOnMobileWhenWinnerVisible = true,
}: CreatorAttributionProps) {
  if (!battle.creator) return null;

  const hideOnMobile = hideOnMobileWhenWinnerVisible && Boolean(battle.winner);

  return (
    <Link
      href={`/profile/${battle.creator.userId}`}
      className={`inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors ${
        hideOnMobile ? "hidden md:inline-flex" : ""
      }`}
    >
      <User className="w-4 h-4" />
      <span>Created by {battle.creator.displayName}</span>
    </Link>
  );
}
