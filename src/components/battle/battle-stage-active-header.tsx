/**
 * Active mode header for battle stage
 * Shows stage info, round tracker, live status, and winner announcement
 */

"use client";

import { motion } from "framer-motion";
import { getBattleProgress, getWinnerPosition } from "@/lib/battle-engine";
import type { Battle } from "@/lib/shared";
import { DEFAULT_STAGE, getStage } from "@/lib/shared/stages";
import type { ConnectionStatus } from "@/lib/websocket/types";
import { BattleBell } from "../battle-bell";
import { LiveStatusBadge } from "../live-status-badge";
import { RoundTracker } from "../round-tracker";
import { VictoryConfetti } from "../victory-confetti";
import { BattleHeader } from "./battle-header";

interface BattleStageActiveHeaderProps {
  battle: Battle;
  isLive: boolean;
  liveConnectionStatus: ConnectionStatus;
  liveViewerCount: number;
  canManageLive: boolean;
  onDisconnect?: () => void;
  confettiOrigin: { x: number; y: number } | null;
  trophyRef: React.RefObject<HTMLDivElement | null>;
  winnerNameRef: React.RefObject<HTMLSpanElement | null>;
}

export function BattleStageActiveHeader({
  battle,
  isLive,
  liveConnectionStatus,
  liveViewerCount,
  canManageLive,
  onDisconnect,
  confettiOrigin,
  trophyRef,
  winnerNameRef,
}: BattleStageActiveHeaderProps) {
  const progress = getBattleProgress(battle);
  const stage = getStage(battle.stageId) || DEFAULT_STAGE;

  return (
    <BattleHeader sticky={true} variant="blur" className="top-0">
      <div className="flex flex-row md:flex-row items-center justify-between md:justify-start gap-2 md:gap-6">
        <div className="md:flex-1">
          <div className="text-left">
            <div className="text-xs md:text-base text-gray-400 uppercase tracking-wider hidden md:block">
              Stage:
            </div>
            <div className="text-lg md:text-3xl font-bold text-white flex flex-col">
              <span>{stage.name}</span>
              <span className="text-[11px] md:text-base text-gray-400 font-normal flex items-center gap-1">
                <span className="text-base md:text-2xl">{stage.flag}</span>
                {stage.country}
              </span>
            </div>
          </div>
        </div>

        <BattleBell
          currentRound={battle.currentRound}
          completedRounds={progress.completedRounds}
        />

        <div className="md:flex-1 md:flex md:justify-end md:items-center md:gap-3">
          {isLive && (
            <LiveStatusBadge
              isLive={isLive}
              viewerCount={liveViewerCount}
              connectionStatus={liveConnectionStatus}
              canToggle={canManageLive}
              onToggle={onDisconnect}
            />
          )}
          <RoundTracker
            currentRound={battle.currentRound}
            completedRounds={progress.completedRounds}
          />
        </div>
      </div>

      {battle.status === "completed" && battle.winner && (
        <motion.div
          ref={trophyRef}
          className="mt-4 md:mt-6 text-center relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <VictoryConfetti
            trigger={confettiOrigin !== null}
            origin={confettiOrigin ?? undefined}
          />
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue) relative z-10">
            🏆 WINNER:{" "}
            <span ref={winnerNameRef}>
              {getWinnerPosition(battle) === "player1"
                ? battle.personas.player1.name
                : battle.personas.player2.name}
            </span>{" "}
            🏆
          </div>
        </motion.div>
      )}
    </BattleHeader>
  );
}
