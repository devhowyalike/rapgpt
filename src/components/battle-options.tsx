"use client";

import { useState, useRef, useEffect } from "react";
import { Switch } from "./ui/switch";
import {
  Radio,
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Play,
  type LucideIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface OptionRowProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  badge?: string;
}

function OptionRow({
  icon: Icon,
  iconColor,
  iconBgColor,
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  badge,
}: OptionRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-2 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`flex items-center justify-center w-10 h-10 shrink-0 rounded-full ${iconBgColor}`}
        >
          <Icon size={20} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-pretty">
            {title}{" "}
            {badge && (
              <span className={`text-xs ${iconColor} ml-2`}>{badge}</span>
            )}
          </div>
          <div className="text-gray-400 text-sm text-pretty">{description}</div>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  );
}

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
  /** Whether advancing a round auto-starts the first verse */
  autoStartOnAdvance?: boolean;
  /** Callback when auto-start setting changes */
  onAutoStartOnAdvanceChange?: (enabled: boolean) => void;
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
  autoStartOnAdvance = true,
  onAutoStartOnAdvanceChange,
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
        className="w-full max-w-lg"
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
                <OptionRow
                  icon={ThumbsUp}
                  iconColor="text-blue-400"
                  iconBgColor="bg-blue-900/50 border border-blue-500/50"
                  title="Enable Voting"
                  description="Allow viewers to vote for their favorite verses"
                  checked={votingEnabled}
                  onCheckedChange={onVotingEnabledChange}
                />
              )}

              {/* Comments Toggle - Only show if globally enabled */}
              {isCommentsGloballyEnabled && (
                <OptionRow
                  icon={MessageSquare}
                  iconColor="text-green-400"
                  iconBgColor="bg-green-900/50 border border-green-500/50"
                  title="Enable Comments"
                  description="Allow viewers to leave comments on the battle"
                  checked={commentsEnabled}
                  onCheckedChange={onCommentsEnabledChange}
                />
              )}

              {/* Auto-start first verse after advancing - Coming Soon */}
              <OptionRow
                icon={Play}
                iconColor="text-teal-400"
                iconBgColor="bg-teal-900/50 border border-teal-500/50"
                title="Auto-start verse on next round"
                description="When advancing rounds, immediately start the first artist"
                checked={true}
                onCheckedChange={() => {}}
                disabled={true}
                badge="(Coming Soon)"
              />

              {/* Go Live Toggle - Coming Soon */}
              <OptionRow
                icon={Radio}
                iconColor="text-purple-400"
                iconBgColor="bg-purple-900/50 border border-purple-500/50"
                title="Go Live"
                description="Stream your battle & engage with your audience in real-time"
                checked={false}
                onCheckedChange={() => {}}
                disabled={true}
                badge="(Coming Soon)"
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
