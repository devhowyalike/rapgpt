"use client";

import { useState, useRef, useEffect } from "react";
import { Switch } from "./ui/switch";
import {
  Radio,
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface BattleOptionsProps {
  /** Whether voting is enabled for this battle */
  votingEnabled: boolean;
  /** Callback when voting enabled state changes */
  onVotingEnabledChange: (enabled: boolean) => void;
  /** Whether comments are enabled for this battle */
  commentsEnabled: boolean;
  /** Callback when comments enabled state changes */
  onCommentsEnabledChange: (enabled: boolean) => void;
  /** Whether to create as live/featured battle */
  createAsLive: boolean;
  /** Callback when create as live state changes */
  onCreateAsLiveChange: (enabled: boolean) => void;
  /** Whether the current user is an admin (for backwards compatibility) */
  isAdmin: boolean;
  /** Whether voting is globally enabled via env flags */
  isVotingGloballyEnabled?: boolean;
  /** Whether comments are globally enabled via env flags */
  isCommentsGloballyEnabled?: boolean;
}

export function BattleOptions({
  votingEnabled,
  onVotingEnabledChange,
  commentsEnabled,
  onCommentsEnabledChange,
  createAsLive,
  onCreateAsLiveChange,
  isAdmin,
  isVotingGloballyEnabled = true,
  isCommentsGloballyEnabled = true,
}: BattleOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Scroll to the options and focus when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Use a small timeout to ensure the content is rendered before scrolling
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // Focus the trigger element for accessibility
        triggerRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Don't render if no options are available
  if (!isVotingGloballyEnabled && !isCommentsGloballyEnabled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="w-full max-w-7xl mx-auto mb-6 flex justify-center"
    >
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full max-w-2xl"
      >
        <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <CollapsibleTrigger
            ref={triggerRef}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
          >
            <h3 className="text-white font-bold text-xl">Battle Options</h3>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-6 pb-6 pt-2 space-y-4">
              {/* Voting Toggle - Only show if globally enabled */}
              {isVotingGloballyEnabled && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-blue-900/50 border border-blue-500/50">
                      <ThumbsUp size={20} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">
                        Enable Voting
                      </div>
                      <div className="text-gray-400 text-sm line-clamp-2 text-pretty">
                        Allow viewers to vote for their favorite verses
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={votingEnabled}
                    onCheckedChange={onVotingEnabledChange}
                    className="shrink-0"
                  />
                </div>
              )}

              {/* Comments Toggle - Only show if globally enabled */}
              {isCommentsGloballyEnabled && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-green-900/50 border border-green-500/50">
                      <MessageSquare size={20} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">
                        Enable Comments
                      </div>
                      <div className="text-gray-400 text-sm line-clamp-2 text-pretty">
                        Allow viewers to leave comments on the battle
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={commentsEnabled}
                    onCheckedChange={onCommentsEnabledChange}
                    className="shrink-0"
                  />
                </div>
              )}

              {/* Go Live Toggle - Available to all authenticated users */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-purple-900/50 border border-purple-500/50">
                    <Radio size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate">
                      Go Live
                    </div>
                    <div className="text-gray-400 text-sm line-clamp-2 text-pretty">
                      Stream your battle & engage with your audience in
                      real-time
                    </div>
                  </div>
                </div>
                <Switch
                  checked={createAsLive}
                  onCheckedChange={onCreateAsLiveChange}
                  className="shrink-0"
                />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
