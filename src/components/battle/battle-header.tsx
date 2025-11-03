/**
 * Unified battle header wrapper component
 * Provides consistent sticky header structure with customizable content
 */

"use client";

import { cn } from "@/lib/utils";

interface BattleHeaderProps {
  /**
   * Whether the header should stick to the top
   * @default true
   */
  sticky?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Header content (slot-based pattern)
   */
  children: React.ReactNode;
  /**
   * Background style variant
   * @default "blur" - semi-transparent with backdrop blur
   */
  variant?: "blur" | "solid" | "transparent";
}

export function BattleHeader({
  sticky = true,
  className,
  children,
  variant = "blur",
}: BattleHeaderProps) {
  const variantClasses = {
    blur: "bg-stage-darker/95 backdrop-blur-sm",
    solid: "bg-stage-darker",
    transparent: "bg-transparent",
  };

  return (
    <div
      className={cn(
        "left-0 right-0 z-20 px-4 py-2 md:px-6 md:py-4 border-b border-gray-800",
        sticky && "sticky top-(--header-height) md:top-auto md:relative",
        variantClasses[variant],
        className
      )}
    >
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}


