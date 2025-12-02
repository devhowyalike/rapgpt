/**
 * Admin control panel for managing live battles
 */

"use client";

import {
  ArrowRight,
  MessageSquare,
  Play,
  Radio,
  Settings,
  StopCircle,
  Users,
  Vote,
} from "lucide-react";
import { useState } from "react";
import { BattleStateInfo } from "@/components/battle/battle-state-info";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Battle } from "@/lib/shared";
import { getAdvanceRoundButtonText } from "@/lib/shared";
import type { ConnectionStatus } from "@/lib/websocket/types";

interface BattleControlPanelProps {
  battle: Battle;
  connectionStatus: ConnectionStatus;
  viewerCount: number;
  onStartLive: () => Promise<void>;
  onStopLive: () => Promise<void>;
  onGenerateVerse: () => Promise<void>;
  onAdvanceRound: () => Promise<void>;
  onUpdateBattleConfig?: (config: {
    commentsEnabled?: boolean;
    votingEnabled?: boolean;
  }) => Promise<void>;
  isGenerating?: boolean;
}

export function BattleControlPanel({
  battle,
  connectionStatus,
  viewerCount,
  onStartLive,
  onStopLive,
  onGenerateVerse,
  onAdvanceRound,
  onUpdateBattleConfig,
  isGenerating = false,
}: BattleControlPanelProps) {
  const [showBattleConfig, setShowBattleConfig] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  const isLive = battle.isLive;

  // Handle battle config changes (comments/voting)
  const handleBattleConfigChange = async (config: {
    commentsEnabled?: boolean;
    votingEnabled?: boolean;
  }) => {
    if (!onUpdateBattleConfig) return;
    setIsUpdatingConfig(true);
    try {
      await onUpdateBattleConfig(config);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const handleStartLive = async () => {
    setIsStarting(true);
    try {
      await onStartLive();
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopLive = async () => {
    setIsStopping(true);
    try {
      await onStopLive();
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="bg-gray-900 border-l border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-2">Admin Controls</h2>
        <div className="flex items-center gap-2 text-sm">
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded ${
              connectionStatus === "connected"
                ? "bg-green-500/20 text-green-400"
                : "bg-orange-500/20 text-orange-400"
            }`}
          >
            <Radio className="w-3 h-3" />
            <span className="capitalize">{connectionStatus}</span>
          </div>
          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/20 text-blue-400">
              <Users className="w-3 h-3" />
              <span>{viewerCount} viewers</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Status & Controls */}
      <div className="p-4 border-b border-gray-800">
        {!isLive ? (
          <button
            onClick={handleStartLive}
            disabled={isStarting || battle.status !== "paused"}
            className="w-full px-4 py-3 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
          >
            {isStarting ? (
              <>
                <LoadingSpinner />
                Starting Live...
              </>
            ) : (
              <>
                <Radio className="w-5 h-5" />
                Go Live
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 p-2 bg-red-600/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 font-bold">BROADCASTING</span>
            </div>
            <button
              onClick={handleStopLive}
              disabled={isStopping}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all"
            >
              {isStopping ? (
                <>
                  <LoadingSpinner size="sm" />
                  Stopping...
                </>
              ) : (
                <>
                  <StopCircle className="w-4 h-4" />
                  End Live
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Battle Config - Comments & Voting */}
      {isLive && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">
              Battle Features
            </span>
            <button
              onClick={() => setShowBattleConfig(!showBattleConfig)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                handleBattleConfigChange({
                  commentsEnabled: !battle.commentsEnabled,
                })
              }
              disabled={isUpdatingConfig}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                battle.commentsEnabled !== false
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-xs">Comments</span>
            </button>
            <button
              onClick={() =>
                handleBattleConfigChange({
                  votingEnabled: !battle.votingEnabled,
                })
              }
              disabled={isUpdatingConfig}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                battle.votingEnabled !== false
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              <span className="text-xs">Voting</span>
            </button>
          </div>

          {showBattleConfig && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
              <p>
                <strong className="text-gray-300">Comments:</strong> Allow
                viewers to post comments during the live battle.
              </p>
              <p className="mt-2">
                <strong className="text-gray-300">Voting:</strong> Enable
                audience voting on verses after each round.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Battle Controls */}
      {isLive && (
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Battle Controls
          </div>

          <button
            onClick={onGenerateVerse}
            disabled={isGenerating || battle.currentTurn === null}
            className="w-full px-4 py-3 bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Generate Next Verse
              </>
            )}
          </button>

          <button
            onClick={onAdvanceRound}
            disabled={battle.currentTurn !== null}
            className="w-full px-4 py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
          >
            <ArrowRight className="w-5 h-5" />
            {getAdvanceRoundButtonText(battle, "End Battle", "Next Round")}
          </button>

          {/* Current State Info */}
          <BattleStateInfo
            battle={battle}
            className="mt-4 p-3 bg-gray-800 rounded-lg space-y-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}
