/**
 * Live battle viewer - watches real-time battle controlled by admin
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Battle } from "@/lib/shared";
import { BattleStage } from "./battle-stage";
import { BattleSidebar } from "./battle-sidebar";
import { SiteHeader } from "./site-header";
import { LiveIndicator } from "./live-indicator";
import { useWebSocket } from "@/lib/websocket/client";
import type { WebSocketEvent } from "@/lib/websocket/types";
import { useBattleStore } from "@/lib/battle-store";
import * as Dialog from "@radix-ui/react-dialog";
import { X, MessageSquare, ThumbsUp, Settings } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

interface LiveBattleViewerProps {
  initialBattle: Battle;
}

export function LiveBattleViewer({ initialBattle }: LiveBattleViewerProps) {
  const {
    battle,
    setBattle,
    addVerse,
    advanceRound,
    setStreamingVerse,
    streamingVerse,
    streamingPersonaId,
    isVotingPhase,
    setIsVotingPhase,
    votingTimeRemaining,
    setVotingTimeRemaining,
    votingCompletedRound,
    completeVotingPhase,
    isReadingPhase,
    setIsReadingPhase,
    readingTimeRemaining,
    setReadingTimeRemaining,
  } = useBattleStore();

  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<"comments" | "voting">(
    "comments"
  );

  // Check if user is admin
  const { sessionClaims, isLoaded } = useAuth();
  const isAdmin = isLoaded && sessionClaims?.metadata?.role === "admin";

  // Initialize battle state
  useEffect(() => {
    setBattle(initialBattle);
  }, [initialBattle, setBattle]);

  // Handle WebSocket events
  const handleWebSocketEvent = useCallback(
    (event: WebSocketEvent) => {
      console.log("[Viewer] Received WebSocket event:", event.type);

      switch (event.type) {
        case "battle:live_started":
          setBattle(event.battle);
          break;

        case "battle:live_ended":
          setBattle(event.battle);
          break;

        case "verse:streaming":
          setStreamingVerse(event.text, event.personaId);
          break;

        case "verse:complete":
          setStreamingVerse(null, null);
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
          setMobileActiveTab("voting");
          setShowMobileDrawer(true);
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

        case "state:sync":
          // Full state sync for late joiners
          setBattle(event.battle);
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
    ]
  );

  // Connect to WebSocket as viewer
  const {
    status: wsStatus,
    viewerCount,
    reconnect,
  } = useWebSocket({
    battleId: initialBattle.id,
    isAdmin: false,
    enabled: true,
    onEvent: handleWebSocketEvent,
  });

  // Fetch latest battle state when WebSocket connects (for late joiners)
  useEffect(() => {
    if (wsStatus === "connected") {
      console.log("[Viewer] Connected - fetching latest battle state");
      fetch(`/api/battle/${initialBattle.id}/sync`)
        .then((res) => res.json())
        .then((data) => {
          if (data.battle) {
            console.log(
              "[Viewer] Received synced state with",
              data.battle.comments.length,
              "comments"
            );
            setBattle(data.battle);
          }
        })
        .catch((error) => {
          console.error("[Viewer] Failed to sync state:", error);
        });
    }
  }, [wsStatus, initialBattle.id, setBattle]);

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
        completeVotingPhase(battle.currentRound);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    votingTimeRemaining,
    isVotingPhase,
    setVotingTimeRemaining,
    battle,
    completeVotingPhase,
  ]);

  const handleVote = async (
    round: number,
    personaId: string
  ): Promise<boolean> => {
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

      // Don't update local state - wait for WebSocket broadcast
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit comment");
      }

      const data = await response.json();

      // Optimistically update local state immediately (don't wait for WebSocket)
      // This ensures the user sees their comment right away
      if (data.comment) {
        setBattle({
          ...battle,
          comments: [...battle.comments, data.comment],
        });
      }
    } catch (error) {
      console.error("Error commenting:", error);
      alert(
        `Failed to post comment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  if (!battle) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SiteHeader />
      <div style={{ height: "52px" }} />

      {/* Live Indicator Banner */}
      <div className="bg-gray-900 border-b border-gray-800 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <LiveIndicator
            isLive={battle.isLive}
            viewerCount={viewerCount}
            connectionStatus={wsStatus}
          />

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href={`/admin/battles/${battle.id}/control`}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm font-medium flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Control Panel</span>
              </Link>
            )}

            {wsStatus === "error" && (
              <button
                onClick={reconnect}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:h-[calc(100vh-7.5rem)] md:flex-row">
        {/* Battle Stage */}
        <div className="flex-1 flex flex-col min-h-0">
          <BattleStage
            battle={battle}
            streamingPersonaId={streamingPersonaId}
            streamingText={streamingVerse}
            isReadingPhase={isReadingPhase}
            isVotingPhase={isVotingPhase}
            votingCompletedRound={votingCompletedRound}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-96">
          <BattleSidebar
            battle={battle}
            onVote={handleVote}
            onComment={handleComment}
            isVotingPhase={isVotingPhase}
            votingTimeRemaining={votingTimeRemaining}
            votingCompletedRound={votingCompletedRound}
          />
        </div>
      </div>

      {/* Mobile Floating Action Buttons */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-row items-center gap-3 md:hidden z-40">
        <button
          onClick={() => {
            setMobileActiveTab("comments");
            setShowMobileDrawer(true);
          }}
          className={`
            w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
            ${
              showMobileDrawer && mobileActiveTab === "comments"
                ? "bg-blue-600/90 text-white border-blue-400/50 scale-110"
                : "bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-blue-600/90 hover:text-white hover:border-blue-500/50 hover:scale-105"
            }
          `}
        >
          <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => {
            setMobileActiveTab("voting");
            setShowMobileDrawer(true);
          }}
          className={`
            w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
            ${
              showMobileDrawer && mobileActiveTab === "voting"
                ? "bg-purple-600/90 text-white border-purple-400/50 scale-110"
                : "bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-purple-600/90 hover:text-white hover:border-purple-500/50 hover:scale-105"
            }
          `}
        >
          <ThumbsUp className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <Dialog.Root open={showMobileDrawer} onOpenChange={setShowMobileDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
              <Dialog.Title className="text-lg font-bold text-white">
                {mobileActiveTab === "comments" ? "Comments" : "Voting"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <BattleSidebar
                battle={battle}
                onVote={handleVote}
                onComment={handleComment}
                isVotingPhase={isVotingPhase}
                votingTimeRemaining={votingTimeRemaining}
                votingCompletedRound={votingCompletedRound}
                defaultTab={mobileActiveTab}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
