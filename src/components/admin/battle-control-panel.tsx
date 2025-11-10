/**
 * Admin control panel for managing live battles
 */

"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  StopCircle,
  ArrowRight,
  Settings,
  Zap,
  Radio,
  Users,
  Clock,
} from "lucide-react";
import type { Battle } from "@/lib/shared";
import { getAdvanceRoundButtonText } from "@/lib/shared";
import type { ConnectionStatus } from "@/lib/websocket/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BattleStateInfo } from "@/components/battle/battle-state-info";

interface BattleControlPanelProps {
  battle: Battle;
  connectionStatus: ConnectionStatus;
  viewerCount: number;
  onStartLive: () => Promise<void>;
  onStopLive: () => Promise<void>;
  onGenerateVerse: () => Promise<void>;
  onAdvanceRound: () => Promise<void>;
  onToggleAutoPlay: (enabled: boolean) => void;
  onUpdateAutoPlayConfig: (config: Battle["autoPlayConfig"]) => void;
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
  onToggleAutoPlay,
  onUpdateAutoPlayConfig,
  isGenerating = false,
}: BattleControlPanelProps) {
  const [showAutoPlaySettings, setShowAutoPlaySettings] = useState(false);
  const [autoPlayConfig, setAutoPlayConfig] = useState<
    Battle["autoPlayConfig"]
  >(
    battle.autoPlayConfig || {
      verseDelay: 30,
      autoAdvance: true,
      readingDuration: 20,
      votingDuration: 10,
    }
  );
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const isLive = battle.isLive;
  const isAutoPlay = battle.adminControlMode === "auto";
  const isManual = battle.adminControlMode === "manual";

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

  const handleAutoPlayToggle = () => {
    const newMode = isAutoPlay ? "manual" : "auto";
    onToggleAutoPlay(newMode === "auto");
  };

  const handleConfigChange = (
    key: keyof NonNullable<Battle["autoPlayConfig"]>,
    value: number | boolean
  ) => {
    const newConfig = { ...autoPlayConfig, [key]: value };
    setAutoPlayConfig(newConfig);
    onUpdateAutoPlayConfig(newConfig);
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

      {/* Control Mode Toggle */}
      {isLive && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">
              Control Mode
            </span>
            <button
              onClick={() => setShowAutoPlaySettings(!showAutoPlaySettings)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onToggleAutoPlay(false)}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                isManual
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <span className="block text-xs">Manual</span>
            </button>
            <button
              onClick={() => onToggleAutoPlay(true)}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                isAutoPlay
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <span className="block text-xs">Auto-Play</span>
            </button>
          </div>

          {/* Auto-Play Settings */}
          {showAutoPlaySettings && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Verse Delay (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={autoPlayConfig?.verseDelay || 30}
                  onChange={(e) =>
                    handleConfigChange("verseDelay", parseInt(e.target.value))
                  }
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Reading Phase (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={autoPlayConfig?.readingDuration || 20}
                  onChange={(e) =>
                    handleConfigChange(
                      "readingDuration",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Voting Phase (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={autoPlayConfig?.votingDuration || 10}
                  onChange={(e) =>
                    handleConfigChange(
                      "votingDuration",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={autoPlayConfig?.autoAdvance !== false}
                  onChange={(e) =>
                    handleConfigChange("autoAdvance", e.target.checked)
                  }
                  className="rounded"
                />
                Auto-advance rounds
              </label>
            </div>
          )}
        </div>
      )}

      {/* Manual Controls */}
      {isLive && isManual && (
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Manual Controls
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

      {/* Auto-Play Status */}
      {isLive && isAutoPlay && (
        <div className="flex-1 p-4">
          <div className="flex items-center justify-center gap-2 p-4 bg-purple-600/20 rounded-lg">
            <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
            <div className="text-center">
              <div className="text-purple-400 font-bold">Auto-Play Active</div>
              <div className="text-xs text-purple-300 mt-1">
                Battle is running automatically
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-800 rounded-lg space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Verse Delay
              </span>
              <span className="text-white font-medium">
                {autoPlayConfig?.verseDelay || 30}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Reading Phase</span>
              <span className="text-white font-medium">
                {autoPlayConfig?.readingDuration || 20}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Voting Phase</span>
              <span className="text-white font-medium">
                {autoPlayConfig?.votingDuration || 10}s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
