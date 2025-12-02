/**
 * Unified hook for managing live battle state
 * Consolidates WebSocket connection, live mode toggling, reading/voting phases,
 * and all live battle event handling.
 */

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Radio } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useBattleStore } from "@/lib/battle-store";
import type { Battle } from "@/lib/shared";
import { useWebSocket } from "@/lib/websocket/client";
import type { ConnectionStatus, WebSocketEvent } from "@/lib/websocket/types";

interface UseLiveBattleStateOptions {
  /** Initial battle data */
  initialBattle: Battle;
  /** Whether the current user can manage (admin/owner) this battle */
  canManage: boolean;
  /** Callback when mobile drawer tab should change */
  onMobileTabChange?: (tab: "comments" | "voting") => void;
  /** Callback when mobile drawer should open */
  onMobileDrawerOpen?: () => void;
  /** Callback when mobile drawer should close */
  onMobileDrawerClose?: () => void;
}

interface UseLiveBattleStateReturn {
  // Connection state
  wsStatus: ConnectionStatus;
  viewerCount: number;
  reconnect: () => void;

  // Live mode controls
  isLive: boolean;
  isStartingLive: boolean;
  isStoppingLive: boolean;
  startLive: () => Promise<void>;
  stopLive: () => Promise<void>;

  // Phase state
  isReadingPhase: boolean;
  readingTimeRemaining: number | null;
  isVotingPhase: boolean;
  votingTimeRemaining: number | null;
  votingCompletedRound: number | null;

  // Phase controls (for admins triggering phases)
  beginReadingPhase: (duration?: number) => void;
  beginVotingPhase: (duration?: number) => void;
  completeVotingPhase: (round: number) => void;

  // Config controls
  updateBattleConfig: (config: {
    commentsEnabled?: boolean;
    votingEnabled?: boolean;
  }) => Promise<void>;

  // Battle ended dialog (for viewers)
  BattleEndedDialog: () => React.JSX.Element;

  // Flag indicating host ended the battle while viewer was watching
  hostEndedBattle: boolean;
}

export function useLiveBattleState({
  initialBattle,
  canManage,
  onMobileTabChange,
  onMobileDrawerOpen,
  onMobileDrawerClose,
}: UseLiveBattleStateOptions): UseLiveBattleStateReturn {
  const {
    battle,
    setBattle,
    addVerse,
    setStreamingVerse,
    isVotingPhase,
    setIsVotingPhase,
    votingTimeRemaining,
    setVotingTimeRemaining,
    votingCompletedRound,
    completeVotingPhase: storeCompleteVotingPhase,
    isReadingPhase,
    setIsReadingPhase,
    readingTimeRemaining,
    setReadingTimeRemaining,
  } = useBattleStore();

  const [isStartingLive, setIsStartingLive] = useState(false);
  const [isStoppingLive, setIsStoppingLive] = useState(false);
  const [hasInitiallyConnected, setHasInitiallyConnected] = useState(false);
  const [showBattleEndedDialog, setShowBattleEndedDialog] = useState(false);
  const [hostEndedBattle, setHostEndedBattle] = useState(false);
  // Track if we were ever live - keeps WebSocket connected for restart notifications
  const [wasEverLive, setWasEverLive] = useState(initialBattle.isLive ?? false);

  // Initialize battle state
  useEffect(() => {
    setBattle(initialBattle);
  }, [initialBattle, setBattle]);

  // Handle WebSocket events
  const handleWebSocketEvent = useCallback(
    (event: WebSocketEvent) => {
      console.log("[LiveBattleState] Received WebSocket event:", event.type);

      switch (event.type) {
        case "battle:live_started":
          setBattle(event.battle);
          // Reset the host ended flag when battle restarts - this notifies viewers
          if (hostEndedBattle) {
            setHostEndedBattle(false);
            setShowBattleEndedDialog(false);
            // Allow a fresh sync to happen when the host restarts
            setHasInitiallyConnected(false);
            // Show toast notification that battle is live again
            toast.success("Battle is back live!", {
              description: "The host has restarted the broadcast.",
              duration: 4000,
            });
          }
          break;

        case "state:sync":
          setBattle(event.battle);
          break;

        case "battle:live_ended":
          setBattle(event.battle);
          // Show dialog and set flag for viewers (non-managers) when host ends the battle
          if (!canManage) {
            setShowBattleEndedDialog(true);
            setHostEndedBattle(true);
          }
          break;

        case "verse:streaming": {
          // Use currentTurn for position since the verse being streamed is for the current turn
          const streamPosition = battle?.currentTurn || null;
          setStreamingVerse(event.text, event.personaId, streamPosition);
          break;
        }

        case "verse:complete":
          setStreamingVerse(null, null, null);
          if (battle) {
            addVerse(event.personaId, event.verseText);
          }
          break;

        case "phase:reading":
          setIsReadingPhase(true);
          setReadingTimeRemaining(event.duration);
          break;

        case "phase:voting":
          setIsReadingPhase(false);
          setIsVotingPhase(true);
          setVotingTimeRemaining(event.duration);
          onMobileTabChange?.("voting");
          onMobileDrawerOpen?.();
          break;

        case "round:advanced":
          setIsReadingPhase(false);
          setIsVotingPhase(false);
          setReadingTimeRemaining(null);
          setVotingTimeRemaining(null);
          setBattle(event.battle);
          break;

        case "battle:completed":
          setIsReadingPhase(false);
          setIsVotingPhase(false);
          setBattle(event.battle);
          break;

        case "vote:cast":
          setBattle(event.battle);
          break;

        case "comment:added":
          if (battle) {
            // Check if comment already exists (to avoid duplicates from optimistic update)
            const commentExists = battle.comments.some(
              (c) => c.id === event.comment.id
            );
            if (!commentExists) {
              setBattle({
                ...battle,
                comments: [...battle.comments, event.comment],
              });
            }
          }
          break;
      }
    },
    [
      battle,
      setBattle,
      setStreamingVerse,
      addVerse,
      setIsReadingPhase,
      setReadingTimeRemaining,
      setIsVotingPhase,
      setVotingTimeRemaining,
      onMobileTabChange,
      onMobileDrawerOpen,
      canManage,
      hostEndedBattle,
    ]
  );

  // Track when battle goes live to keep WebSocket connected for restart notifications
  useEffect(() => {
    if (battle?.isLive) {
      setWasEverLive(true);
    }
  }, [battle?.isLive]);

  // Keep WebSocket connected as long as viewer is on a battle page that was/is live
  // This ensures they receive restart notifications if host ends and restarts
  // Connection naturally closes when they navigate away (component unmount)
  const {
    status: wsStatus,
    viewerCount,
    reconnect,
  } = useWebSocket({
    battleId: initialBattle.id,
    isAdmin: canManage,
    enabled: wasEverLive,
    onEvent: handleWebSocketEvent,
  });

  // Fetch latest battle state when WebSocket connects for the first time
  useEffect(() => {
    if (wsStatus === "connected" && !hasInitiallyConnected && battle?.isLive) {
      console.log(
        "[LiveBattleState] Initial connection - fetching latest battle state"
      );
      setHasInitiallyConnected(true);
      fetch(`/api/battle/${initialBattle.id}/sync`)
        .then((res) => res.json())
        .then((data) => {
          if (data.battle) {
            console.log(
              "[LiveBattleState] Received synced state with",
              data.battle.comments.length,
              "comments"
            );
            setBattle(data.battle);
          }
        })
        .catch((error) => {
          console.error("[LiveBattleState] Failed to sync state:", error);
        });
    }
  }, [
    wsStatus,
    hasInitiallyConnected,
    initialBattle.id,
    setBattle,
    battle?.isLive,
  ]);

  // Reading phase countdown
  useEffect(() => {
    if (
      !isReadingPhase ||
      readingTimeRemaining === null ||
      readingTimeRemaining <= 0
    ) {
      return;
    }

    const timer = setInterval(() => {
      const next = (readingTimeRemaining ?? 0) - 1;
      setReadingTimeRemaining(next);
      if (next <= 0) {
        setIsReadingPhase(false);
        setReadingTimeRemaining(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    readingTimeRemaining,
    isReadingPhase,
    setReadingTimeRemaining,
    setIsReadingPhase,
  ]);

  // Voting phase countdown
  useEffect(() => {
    if (
      !isVotingPhase ||
      votingTimeRemaining === null ||
      votingTimeRemaining <= 0
    ) {
      return;
    }

    const timer = setInterval(() => {
      const next = (votingTimeRemaining ?? 0) - 1;
      setVotingTimeRemaining(next);
      if (next <= 0 && battle) {
        storeCompleteVotingPhase(battle.currentRound);
        // On mobile, close the drawer when voting ends
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          onMobileDrawerClose?.();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    votingTimeRemaining,
    isVotingPhase,
    setVotingTimeRemaining,
    battle,
    storeCompleteVotingPhase,
    onMobileDrawerClose,
  ]);

  // Start live mode
  const startLive = useCallback(async () => {
    if (!battle || isStartingLive) return;

    setIsStartingLive(true);
    try {
      const response = await fetch(`/api/battle/${battle.id}/live/start`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to start live mode");
      }

      const { battle: updatedBattle } = await response.json();

      // We no longer force-enable comments/voting here.
      // The user's previous choice (persisted in DB) should be respected.
      setBattle(updatedBattle);

      // Notify header to refresh live battles
      window.dispatchEvent(new CustomEvent("battle:status-changed"));

      // Reset connection state for fresh sync
      setHasInitiallyConnected(false);
    } catch (error) {
      console.error("Error starting live mode:", error);
      throw error;
    } finally {
      setIsStartingLive(false);
    }
  }, [battle, isStartingLive, setBattle]);

  // Stop live mode
  const stopLive = useCallback(async () => {
    if (!battle || isStoppingLive) return;

    setIsStoppingLive(true);
    try {
      const response = await fetch(`/api/battle/${battle.id}/live/stop`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to stop live mode");
      }

      const { battle: updatedBattle } = await response.json();
      setBattle(updatedBattle);

      // Notify header to refresh live battles
      window.dispatchEvent(new CustomEvent("battle:status-changed"));
    } catch (error) {
      console.error("Error stopping live mode:", error);
      throw error;
    } finally {
      setIsStoppingLive(false);
    }
  }, [battle, isStoppingLive, setBattle]);

  // Begin reading phase
  const beginReadingPhase = useCallback(
    (duration = 20) => {
      setIsReadingPhase(true);
      setReadingTimeRemaining(duration);
    },
    [setIsReadingPhase, setReadingTimeRemaining]
  );

  // Begin voting phase
  const beginVotingPhase = useCallback(
    (duration = 10) => {
      setIsReadingPhase(false);
      setReadingTimeRemaining(null);
      setIsVotingPhase(true);
      setVotingTimeRemaining(duration);
    },
    [
      setIsReadingPhase,
      setReadingTimeRemaining,
      setIsVotingPhase,
      setVotingTimeRemaining,
    ]
  );

  // Complete voting phase
  const completeVotingPhase = useCallback(
    (round: number) => {
      storeCompleteVotingPhase(round);
    },
    [storeCompleteVotingPhase]
  );

  // Update battle config (comments/voting enabled)
  const updateBattleConfig = useCallback(
    async (config: { commentsEnabled?: boolean; votingEnabled?: boolean }) => {
      if (!battle) return;

      try {
        const response = await fetch(`/api/battle/${battle.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...battle,
            ...config,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update battle config");
        }

        const data = await response.json();
        setBattle(data.battle || { ...battle, ...config });
      } catch (error) {
        console.error("Error updating battle config:", error);
        throw error;
      }
    },
    [battle, setBattle]
  );

  // Battle ended dialog component for viewers
  const BattleEndedDialog = useCallback(
    () => (
      <Dialog.Root
        open={showBattleEndedDialog}
        onOpenChange={setShowBattleEndedDialog}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center">
                <Radio className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-xl font-bold text-white mb-2">
                  Live Broadcast Ended
                </Dialog.Title>
                <Dialog.Description className="text-gray-400 mb-4">
                  The host has ended this live battle. You can still view the
                  battle results and replay the verses.
                </Dialog.Description>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBattleEndedDialog(false)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    ),
    [showBattleEndedDialog]
  );

  return {
    // Connection state
    wsStatus,
    viewerCount,
    reconnect,

    // Live mode controls
    isLive: battle?.isLive ?? false,
    isStartingLive,
    isStoppingLive,
    startLive,
    stopLive,

    // Phase state
    isReadingPhase,
    readingTimeRemaining,
    isVotingPhase,
    votingTimeRemaining,
    votingCompletedRound,

    // Phase controls
    beginReadingPhase,
    beginVotingPhase,
    completeVotingPhase,

    // Config controls
    updateBattleConfig,

    // Battle ended dialog
    BattleEndedDialog,

    // Host ended battle flag
    hostEndedBattle,
  };
}
