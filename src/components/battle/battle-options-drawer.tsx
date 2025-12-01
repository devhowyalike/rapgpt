/**
 * Drawer content for battle options (comments, voting toggles, admin controls)
 */

"use client";

import { MessageSquare, Pause, Vote } from "lucide-react";
import { BattleDrawer } from "@/components/ui/battle-drawer";
import { DrawerScrollContent } from "@/components/ui/drawer-scroll-content";
import { Switch } from "@/components/ui/switch";

interface BattleOptionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showCommenting: boolean;
  showVoting: boolean;
  onToggleCommenting?: (enabled: boolean) => void;
  onToggleVoting?: (enabled: boolean) => void;
  onPauseBattle?: () => void;
  isPausing?: boolean;
  isLive?: boolean;
}

export function BattleOptionsDrawer({
  open,
  onOpenChange,
  showCommenting,
  showVoting,
  onToggleCommenting,
  onToggleVoting,
  onPauseBattle,
  isPausing,
  isLive = false,
}: BattleOptionsDrawerProps) {
  return (
    <BattleDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Battle Options"
      excludeBottomControls
    >
      <DrawerScrollContent className="p-4 space-y-6">
        {/* Toggles Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-full">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white">Comments</span>
                <span className="text-sm text-gray-400">
                  Allow audience to chat
                </span>
              </div>
            </div>
            <Switch
              checked={showCommenting}
              onCheckedChange={onToggleCommenting}
            />
          </div>

          <div
            className={`flex items-center justify-between p-3 bg-gray-800/50 rounded-lg transition-opacity ${
              !isLive ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-full">
                <Vote className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white">Voting</span>
                <span className="text-sm text-gray-400">
                  {isLive ? "Enable crowd judging" : "Go live to activate"}
                </span>
              </div>
            </div>
            <Switch
              checked={showVoting && isLive}
              onCheckedChange={onToggleVoting}
              disabled={!isLive}
            />
          </div>
        </div>

        {/* Actions Section */}
        {onPauseBattle && (
          <div className="space-y-3 pt-2 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </h3>

            <button
              onClick={() => {
                onPauseBattle();
                onOpenChange(false);
              }}
              disabled={isPausing}
              className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors group text-left"
            >
              <div className="p-2 bg-orange-500/20 rounded-full group-hover:bg-orange-500/30 transition-colors">
                <Pause className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white">
                  {isPausing ? "Pausing..." : "Pause Battle"}
                </span>
                <span className="text-sm text-gray-400">
                  Stop the battle temporarily
                </span>
              </div>
            </button>
          </div>
        )}
      </DrawerScrollContent>
    </BattleDrawer>
  );
}
