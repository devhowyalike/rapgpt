/**
 * Dropdown menu for battle options (comments, voting toggles)
 */

"use client";

import { MessageSquare, Pause, Settings, Vote, X } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface BattleOptionsDropdownProps {
  showCommenting: boolean;
  showVoting: boolean;
  onToggleCommenting?: (enabled: boolean) => void;
  onToggleVoting?: (enabled: boolean) => void;
  // New props for moving actions into menu
  onPauseBattle?: () => void;
  isPausing?: boolean;
  pauseLabel?: string;
  customTrigger?: React.ReactNode;
  isLive?: boolean;
}

export function BattleOptionsDropdown({
  showCommenting,
  showVoting,
  onToggleCommenting,
  onToggleVoting,
  onPauseBattle,
  isPausing,
  pauseLabel,
  customTrigger,
  isLive = false,
}: BattleOptionsDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {customTrigger || (
          <button
            className="px-3 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold flex items-center justify-center transition-all"
            aria-label="Battle Options"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 relative">
        {/* Close button - only visible on xl screens */}
        <button
          onClick={() => setOpen(false)}
          className="hidden xl:flex absolute top-2 right-2 items-center justify-center w-6 h-6 rounded-sm hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-100 z-10"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        <DropdownMenuLabel>Battle Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="text-sm">Comments</span>
          </div>
          <Switch
            checked={showCommenting}
            onCheckedChange={onToggleCommenting}
          />
        </div>
        <div className="px-2 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4 text-gray-400" />
            <span className="text-sm">Voting</span>
            {!isLive && (
              <span className="text-[10px] text-gray-500 whitespace-nowrap">
                (Live Battle Only)
              </span>
            )}
          </div>
          <Switch
            checked={showVoting && isLive}
            onCheckedChange={onToggleVoting}
            disabled={!isLive}
          />
        </div>

        {onPauseBattle && <DropdownMenuSeparator />}

        {onPauseBattle && (
          <DropdownMenuItem
            onClick={onPauseBattle}
            disabled={isPausing}
            className="flex items-center gap-2 py-2 text-orange-400 focus:text-orange-500 cursor-pointer"
          >
            <Pause className="w-4 h-4" />
            <span>
              {isPausing ? pauseLabel || "Pausing..." : "Pause Battle"}
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
