"use client";

import { User } from "lucide-react";
import Link from "next/link";
import type { Battle } from "@/lib/shared";

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
  const isProfilePublic = battle.creator.isProfilePublic ?? false;

  const baseClassName = `inline-flex items-center gap-1.5 transition-all duration-300 ${
    hideOnMobile ? "hidden md:inline-flex" : ""
  } ${hideWhenCollapsed ? "text-xs md:gap-1" : "text-sm md:gap-2"}`;

  const content = (
    <>
      <User
        className={`transition-all duration-300 ${
          hideWhenCollapsed ? "w-3 h-3" : "w-4 h-4"
        }`}
      />
      <span>Created by {battle.creator.displayName}</span>
    </>
  );

  // Only link to profile if the profile is public
  if (isProfilePublic) {
    return (
      <Link
        href={`/profile/${battle.creator.userId}`}
        className={`${baseClassName} text-gray-400 hover:text-blue-400`}
      >
        {content}
      </Link>
    );
  }

  // For private profiles, render as plain text without a link
  return (
    <span className={`${baseClassName} text-gray-500`}>
      {content}
    </span>
  );
}
