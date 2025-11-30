/**
 * Mobile floating action buttons for comments and voting
 */

"use client";

import { MessageSquare, ThumbsUp } from "lucide-react";
import type { DrawerTab } from "@/lib/hooks/use-mobile-drawer";

interface MobileActionButtonsProps {
  showCommenting: boolean;
  showVoting: boolean;
  onCommentsClick: () => void;
  onVotingClick: () => void;
  activeTab?: DrawerTab;
  isDrawerOpen?: boolean;
  bottomOffset?: string;
  className?: string;
  settingsAction?: React.ReactNode;
}

export function MobileActionButtons({
  showCommenting,
  showVoting,
  onCommentsClick,
  onVotingClick,
  activeTab,
  isDrawerOpen = false,
  bottomOffset,
  className = "",
  settingsAction,
}: MobileActionButtonsProps) {
  if (!showCommenting && !showVoting && !settingsAction) {
    return null;
  }

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 flex flex-row items-center gap-3 md:hidden z-40 ${className}`}
      style={bottomOffset ? { bottom: bottomOffset } : { bottom: "1.5rem" }}
    >
      {settingsAction}
      {showCommenting && (
        <button
          onClick={onCommentsClick}
          className={`
            w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
            ${
              isDrawerOpen && activeTab === "comments"
                ? "bg-blue-600/90 text-white border-blue-400/50 scale-110"
                : "bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-blue-600/90 hover:text-white hover:border-blue-500/50 hover:scale-105"
            }
          `}
        >
          <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}
      {showVoting && (
        <button
          onClick={onVotingClick}
          className={`
            w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
            ${
              isDrawerOpen && activeTab === "voting"
                ? "bg-purple-600/90 text-white border-purple-400/50 scale-110"
                : "bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-purple-600/90 hover:text-white hover:border-purple-500/50 hover:scale-105"
            }
          `}
        >
          <ThumbsUp className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

