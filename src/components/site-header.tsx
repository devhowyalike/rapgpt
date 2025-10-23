"use client";

import { Home, Archive, MessageSquare, ThumbsUp } from "lucide-react";
import Link from "next/link";

interface SiteHeaderProps {
  showMobileActions?: boolean;
  onCommentsClick?: () => void;
  onVotingClick?: () => void;
  activeTab?: "comments" | "voting";
}

export function SiteHeader({ 
  showMobileActions = false, 
  onCommentsClick, 
  onVotingClick,
  activeTab 
}: SiteHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 p-3 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/archive"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Archive</span>
          </Link>
        </div>

        {/* Mobile Battle Actions */}
        {showMobileActions && (
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onCommentsClick}
              className={`
                flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors
                ${activeTab === "comments" 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
                }
              `}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={onVotingClick}
              className={`
                flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors
                ${activeTab === "voting" 
                  ? "bg-purple-600 text-white" 
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
                }
              `}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
