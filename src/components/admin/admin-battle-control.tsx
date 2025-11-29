/**
 * Admin battle control component - manages live battle with WebSocket
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Battle } from "@/lib/shared";
import { BattleStage } from "../battle-stage";
import { BattleSidebar } from "../battle-sidebar";
import { BattleControlPanel } from "./battle-control-panel";
import { SiteHeader } from "../site-header";
import { useWebSocket } from "@/lib/websocket/client";
import type { WebSocketEvent } from "@/lib/websocket/types";
import { useBattleStore } from "@/lib/battle-store";
import { getNextPerformer } from "@/lib/battle-engine";
import { useNavigationGuard } from "@/lib/hooks/use-navigation-guard";

interface AdminBattleControlProps {
  initialBattle: Battle;
}

export function AdminBattleControl({ initialBattle }: AdminBattleControlProps) {
  console.log(
    "[AdminBattleControl] Component mounting with battle:",
    initialBattle?.id
  );

  const {
    battle,
    setBattle,
    addVerse,
    advanceRound,
    setStreamingVerse,
    streamingVerse,
    streamingPersonaId,
    streamingPosition,
    saveBattle,
  } = useBattleStore();

  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize battle state
  useEffect(() => {
    console.log(
      "[AdminBattleControl] Setting initial battle:",
      initialBattle?.id
    );
    setBattle(initialBattle);
  }, [initialBattle, setBattle]);

  // Handle WebSocket events
  const handleWebSocketEvent = useCallback(
    (event: WebSocketEvent) => {
      console.log("[Admin] Received WebSocket event:", event.type);

      switch (event.type) {
        case "battle:live_started":
        case "battle:live_ended":
        case "state:sync":
          setBattle(event.battle);
          break;

        case "verse:streaming":
          // Determine position by checking which side is currently performing
          // Use currentTurn since we know the verse being streamed is for the current turn
          const streamPosition = battle?.currentTurn || null;
          setStreamingVerse(event.text, event.personaId, streamPosition);
          break;

        case "verse:complete":
          setStreamingVerse(null, null, null);
          if (battle) {
            addVerse(event.personaId, event.verseText);
            // Persist updated battle after adding the verse
            void saveBattle();
          }
          break;

        case "round:advanced":
          setBattle(event.battle);
          break;

        case "battle:completed":
          setBattle(event.battle);
          break;

        case "vote:cast":
          setBattle(event.battle);
          break;

        case "comment:added":
          console.log("[Admin] Received comment:", event.comment.content);
          if (battle) {
            setBattle({
              ...battle,
              comments: [...battle.comments, event.comment],
            });
          }
          break;
      }
    },
    [battle, setBattle, setStreamingVerse, addVerse]
  );

  // Connect to WebSocket as admin
  const { status: wsStatus, viewerCount } = useWebSocket({
    battleId: initialBattle.id,
    isAdmin: true,
    enabled: true,
    onEvent: handleWebSocketEvent,
  });

  console.log(
    "[AdminBattleControl] WebSocket status:",
    wsStatus,
    "viewers:",
    viewerCount
  );

  // Fetch latest battle state when WebSocket connects (for sync)
  useEffect(() => {
    if (wsStatus === "connected") {
      console.log("[Admin] Connected - fetching latest battle state");
      fetch(`/api/battle/${initialBattle.id}/sync`)
        .then((res) => res.json())
        .then((data) => {
          if (data.battle) {
            console.log(
              "[Admin] Received synced state with",
              data.battle.comments.length,
              "comments"
            );
            setBattle(data.battle);
          }
        })
        .catch((error) => {
          console.error("[Admin] Failed to sync state:", error);
        });
    }
  }, [wsStatus, initialBattle.id, setBattle]);

  const handleGenerateVerse = useCallback(async () => {
    const { battle: latestBattle } = useBattleStore.getState();
    if (!latestBattle) return;

    const nextPerformer = getNextPerformer(latestBattle);
    if (!nextPerformer || isGenerating) return;

    const personaId = latestBattle.personas[nextPerformer].id;
    // Use nextPerformer directly as the position (it's already 'player1' or 'player2')
    const position = nextPerformer;
    setIsGenerating(true);
    // Indicate performer is about to stream; rely on WebSocket for actual text
    setStreamingVerse(null, personaId, position);

    try {
      const response = await fetch("/api/battle/generate-verse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battle: latestBattle,
          personaId,
          isLive: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate verse");
      // Do not locally stream or add the verse here; WebSocket events will handle UI updates and persistence
      // We simply await the server to finish streaming
      await response.text();
    } catch (error) {
      console.error("Error generating verse:", error);
      setStreamingVerse(null, null, null);
    } finally {
      setIsGenerating(false);
    }
  }, [battle, isGenerating, setStreamingVerse, addVerse]);

  const handleAdvanceRound = useCallback(async () => {
    if (!battle) return;
    // Update local state first so status/winner/currentRound reflect correctly
    advanceRound();

    try {
      // Persist the updated battle from the store (avoids sending stale state)
      await saveBattle();
      // Auto-start first verse on round advance if enabled (default true)
      const { battle: latestBattle } = useBattleStore.getState();
      if (latestBattle?.autoStartOnAdvance !== false) {
        await handleGenerateVerse();
      }
    } catch (error) {
      console.error("Error saving battle:", error);
    }
  }, [battle, advanceRound, saveBattle, handleGenerateVerse]);

  // Navigation guard - warn admin before leaving live battle
  const { NavigationDialog } = useNavigationGuard({
    when: battle?.isLive ?? false,
    title: "End Live Battle?",
    message:
      "This battle is currently live with viewers watching. Navigating away will completely terminate the live session and end the broadcast for all viewers. This is equivalent to clicking 'End Live'.",
    onConfirm: async () => {
      // Automatically stop the live battle when navigating away
      if (battle?.isLive) {
        await handleStopLive();
      }
    },
  });

  const handleStartLive = async () => {
    try {
      const response = await fetch(
        `/api/battle/${initialBattle.id}/live/start`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start live mode");
      }

      const { battle: updatedBattle } = await response.json();
      setBattle(updatedBattle);
      
      // Notify header to refresh live battles
      window.dispatchEvent(new CustomEvent("battle:status-changed"));
    } catch (error) {
      console.error("Error starting live mode:", error);
      alert("Failed to start live mode");
    }
  };

  const handleStopLive = async () => {
    try {
      const response = await fetch(
        `/api/battle/${initialBattle.id}/live/stop`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to stop live mode");
      }

      const { battle: updatedBattle } = await response.json();
      setBattle(updatedBattle);
      
      // Notify header to refresh live battles
      window.dispatchEvent(new CustomEvent("battle:status-changed"));
    } catch (error) {
      console.error("Error stopping live mode:", error);
      alert("Failed to stop live mode");
    }
  };

  const saveBattleState = async () => {
    if (!battle) return;

    try {
      const response = await fetch(`/api/battle/${battle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(battle),
      });

      if (!response.ok) {
        throw new Error("Failed to save battle");
      }
    } catch (error) {
      console.error("Error saving battle:", error);
    }
  };

  const handleVote = async (
    round: number,
    personaId: string
  ): Promise<boolean> => {
    // Admins can vote like normal users
    if (!battle) return false;

    try {
      const response = await fetch(`/api/battle/${battle.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round, personaId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Vote failed:", errorData.error);
        return false;
      }

      const { battle: updatedBattle } = await response.json();
      setBattle(updatedBattle);
      return true;
    } catch (error) {
      console.error("Error voting:", error);
      return false;
    }
  };

  const handleComment = async (content: string) => {
    if (!battle) return;

    try {
      const response = await fetch(`/api/battle/${battle.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          round: battle.currentRound,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit comment");

      const { comment } = await response.json();

      setBattle({
        ...battle,
        comments: [...battle.comments, comment],
      });
    } catch (error) {
      console.error("Error commenting:", error);
    }
  };

  if (!battle) {
    console.log("[AdminBattleControl] Battle is null, showing loading state");
    return (
      <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading battle...</div>
      </div>
    );
  }

  console.log(
    "[AdminBattleControl] Rendering admin panel for battle:",
    battle.id
  );

  return (
    <>
      <SiteHeader />
      <div style={{ height: "var(--header-height)" }} />

      <div className="flex h-[calc(100dvh-var(--header-height))]">
        {/* Battle View - 60% width */}
        <div className="flex-1 flex flex-col min-w-0">
          <BattleStage
            battle={battle}
            streamingPersonaId={streamingPersonaId}
            streamingText={streamingVerse}
            streamingPosition={streamingPosition}
            isReadingPhase={false}
            isVotingPhase={false}
            votingCompletedRound={null}
            scoreDelaySeconds={5}
          />

          {/* Sidebar for comments/voting */}
          <div className="border-t border-gray-800">
            <BattleSidebar
              battle={battle}
              onVote={handleVote}
              onComment={handleComment}
              isVotingPhase={false}
              votingTimeRemaining={null}
              votingCompletedRound={null}
            />
          </div>
        </div>

        {/* Admin Control Panel - 40% width */}
        <div className="w-[400px]">
          <BattleControlPanel
            battle={battle}
            connectionStatus={wsStatus}
            viewerCount={viewerCount}
            onStartLive={handleStartLive}
            onStopLive={handleStopLive}
            onGenerateVerse={handleGenerateVerse}
            onAdvanceRound={handleAdvanceRound}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Navigation guard dialog */}
      <NavigationDialog />
    </>
  );
}
