/**
 * Battle bottom controls wrapper
 * Fixed bottom bar for battle control buttons/tabs
 */

"use client";

import { cn } from "@/lib/utils";

interface BattleBottomControlsProps {
  /**
   * CSS custom property reference for height
   * @default "var(--bottom-controls-height)"
   */
  height?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Control buttons/tabs content
   */
  children: React.ReactNode;
}

export function BattleBottomControls({
  height = "var(--bottom-controls-height)",
  className,
  children,
}: BattleBottomControlsProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-60 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800",
        className
      )}
      style={{ height }}
    >
      <div className="max-w-4xl mx-auto h-full px-2 md:px-4 flex items-center justify-center gap-2 md:gap-3">
        {children}
      </div>
    </div>
  );
}


