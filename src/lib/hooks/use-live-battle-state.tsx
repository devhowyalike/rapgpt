/**
 * Unified hook for managing live battle state
 * Consolidates WebSocket connection, live mode toggling, reading/voting phases,
 * and all live battle event handling.
 */

"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Radio } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBattleStore } from "@/lib/battle-store";
import type { Battle } from "@/lib/shared";
import { type BattleWarning, useWebSocket } from "@/lib/websocket/client";
import type { ConnectionStatus, WebSocketEvent } from "@/lib/websocket/types";

interface UseLiveBattleStateOptions {
  /** Initial battle data */
  initialBattle: Battle;
  /** Whether the current user can manage (admin/owner) this battle */
  canManage: boolean;
  /** Whether permissions are still being loaded - delays WebSocket until resolved */
  isLoadingPermissions?: boolean;
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
  warning: BattleWarning | null;

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
  beginReadingPhase: (duration?: number) => Promise<void>;
  beginVotingPhase: (duration?: number) => Promise<void>;
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
  isLoadingPermissions = false,
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
          // Close mobile drawer when round advances so viewers see the battle stage
          // xl breakpoint is 1280px - drawer is used below this
          if (typeof window !== "undefined" && window.innerWidth < 1280) {
            onMobileDrawerClose?.();
          }
          break;

        case "battle:completed":
          setIsReadingPhase(false);
          setIsVotingPhase(false);
          setBattle(event.battle);
          // Close mobile drawer when battle completes
          if (typeof window !== "undefined" && window.innerWidth < 1280) {
            onMobileDrawerClose?.();
          }
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
      onMobileDrawerClose,
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

  // Keep WebSocket connected:
  // - Always for admins/managers (so they can go live)
  // - For viewers if battle is/was live (so they receive updates)
  // Connection naturally closes when they navigate away (component unmount)
  // IMPORTANT: Wait for permissions to load so we know the correct isAdmin status
  // Otherwise, admins might connect as viewers and be counted incorrectly
  const {
    status: wsStatus,
    viewerCount,
    warning,
    reconnect,
  } = useWebSocket({
    battleId: initialBattle.id,
    isAdmin: canManage,
    enabled: !isLoadingPermissions && (canManage || wasEverLive),
    onEvent: handleWebSocketEvent,
  });

  // Show toast when warning is received
  useEffect(() => {
    if (!warning) return;

    const reasonMessages: Record<
      BattleWarning["reason"],
      { title: string; description: string }
    > = {
      inactivity: {
        title: "Battle ending soon",
        description: `This live battle will end in ${warning.secondsRemaining}s due to inactivity.`,
      },
      admin_timeout: {
        title: "Host disconnected",
        description: `Battle will end in ${warning.secondsRemaining}s unless the host reconnects.`,
      },
      server_shutdown: {
        title: "Network Connection",
        description:
          warning.message ||
          "The connection was interrupted. We're reconnecting you now.",
      },
      max_lifetime: {
        title: "Battle time limit",
        description: `This battle has reached its maximum duration. Ending in ${warning.secondsRemaining}s.`,
      },
    };

    const msg = reasonMessages[warning.reason];
    toast.warning(msg.title, {
      description: msg.description,
      duration: warning.reason === "server_shutdown" ? 10000 : 5000,
    });
  }, [warning]);

  // Consolidated connection tracking state
  // - prevStableStatus: tracks stable states (connected, disconnected, error) - not transitional "connecting"
  // - hasConnectedOnce: distinguishes initial connection from reconnections
  // - autoResumeAttempted: prevents multiple auto-resume attempts
  const connectionTrackingRef = useRef<{
    prevStableStatus: ConnectionStatus | null;
    hasConnectedOnce: boolean;
    autoResumeAttempted: boolean;
  }>({
    prevStableStatus: null,
    hasConnectedOnce: false,
    autoResumeAttempted: false,
  });

  // Fetch latest battle state when WebSocket connects (initial or reconnection)
  useEffect(() => {
    const tracking = connectionTrackingRef.current;

    // Only update ref and check for reconnection on stable states
    const isStableState =
      wsStatus === "connected" ||
      wsStatus === "disconnected" ||
      wsStatus === "error";

    if (!isStableState) return; // Skip transitional "connecting" state

    const wasDisconnected =
      tracking.prevStableStatus === "disconnected" ||
      tracking.prevStableStatus === "error" ||
      tracking.prevStableStatus === null; // Initial connection
    const justConnected = wsStatus === "connected" && wasDisconnected;
    const isReconnection = tracking.hasConnectedOnce && justConnected;

    // Update tracking state for next comparison
    tracking.prevStableStatus = wsStatus;
    if (justConnected) {
      tracking.hasConnectedOnce = true;
    }

    // Reset auto-resume flag when disconnected (so we can try again on next reconnect)
    if (wsStatus === "disconnected" || wsStatus === "error") {
      tracking.autoResumeAttempted = false;
    }

    // Sync on reconnection when battle is/was live (skip initial - we have initialBattle)
    // Note: We DO sync on initial if wasEverLive because state might have changed
    if (justConnected && wasEverLive) {
      console.log(
        "[LiveBattleState] Connection established - fetching latest battle state"
      );
      fetch(`/api/battle/${initialBattle.id}/sync`)
        .then((res) => res.json())
        .then((data) => {
          if (data.battle) {
            console.log(
              "[LiveBattleState] Received synced state with",
              data.battle.comments.length,
              "comments, isLive:",
              data.battle.isLive
            );
            setBattle(data.battle);

            // Auto-resume live mode for admins after reconnection
            // (e.g., after server restart while running a live battle)
            if (
              isReconnection &&
              canManage &&
              !data.battle.isLive &&
              wasEverLive &&
              !tracking.autoResumeAttempted
            ) {
              tracking.autoResumeAttempted = true; // Prevent multiple attempts
              console.log(
                "[LiveBattleState] Auto-resuming live mode after reconnection"
              );
              fetch(`/api/battle/${initialBattle.id}/live/start`, {
                method: "POST",
              })
                .then((res) => res.json())
                .then((startData) => {
                  if (startData.battle) {
                    setBattle(startData.battle);
                    toast.success("Live session resumed", {
                      description:
                        "Your broadcast has been automatically restored.",
                      duration: 3000,
                    });
                  }
                })
                .catch((err) => {
                  console.error(
                    "[LiveBattleState] Failed to auto-resume:",
                    err
                  );
                });
            }
          }
        })
        .catch((error) => {
          console.error("[LiveBattleState] Failed to sync state:", error);
        });
    }
  }, [wsStatus, initialBattle.id, setBattle, wasEverLive, canManage]);

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
        // Close drawer when voting ends on viewports below xl (1280px)
        // This ensures viewers see the battle stage after voting
        if (typeof window !== "undefined" && window.innerWidth < 1280) {
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

      // Show voting enabled toast once per battle for the host
      const toastKey = `voting-toast-shown-${battle.id}`;
      if (!sessionStorage.getItem(toastKey)) {
        sessionStorage.setItem(toastKey, "true");
        toast.info("Voting is now enabled!", {
          description: "Manage it in the options menu.",
          duration: 5000,
          className: "text-white text-pretty",
          descriptionClassName: "text-white/80 text-pretty",
        });
      }
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
    async (duration = 20) => {
      // Update local state immediately for the admin
      setIsReadingPhase(true);
      setReadingTimeRemaining(duration);

      // Broadcast to viewers if battle is live
      if (battle?.isLive) {
        try {
          await fetch(`/api/battle/${battle.id}/phase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phase: "reading", duration }),
          });
        } catch (error) {
          console.error("[LiveBattleState] Failed to broadcast reading phase:", error);
        }
      }
    },
    [setIsReadingPhase, setReadingTimeRemaining, battle]
  );

  // Begin voting phase
  const beginVotingPhase = useCallback(
    async (duration = 10) => {
      // Update local state immediately for the admin
      setIsReadingPhase(false);
      setReadingTimeRemaining(null);
      setIsVotingPhase(true);
      setVotingTimeRemaining(duration);

      // Broadcast to viewers if battle is live
      if (battle?.isLive) {
        try {
          await fetch(`/api/battle/${battle.id}/phase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phase: "voting", duration }),
          });
        } catch (error) {
          console.error("[LiveBattleState] Failed to broadcast voting phase:", error);
        }
      }
    },
    [
      setIsReadingPhase,
      setReadingTimeRemaining,
      setIsVotingPhase,
      setVotingTimeRemaining,
      battle,
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
      <ConfirmationDialog
        open={showBattleEndedDialog}
        onOpenChange={setShowBattleEndedDialog}
        title="Live Broadcast Ended"
        description="The host has ended this live battle. You can still view the battle results and replay the verses."
        confirmLabel="Got it"
        cancelLabel={null}
        onConfirm={() => setShowBattleEndedDialog(false)}
        variant="default"
        icon={Radio}
      />
    ),
    [showBattleEndedDialog]
  );

  return {
    // Connection state
    wsStatus,
    viewerCount,
    reconnect,
    warning,

    // Live mode controls
    // Use initialBattle as fallback until store is hydrated to avoid flash of "Go Live" button
    isLive: battle?.isLive ?? initialBattle.isLive ?? false,
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
