/**
 * Live battle viewer - watches real-time battle controlled by admin
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Battle } from "@/lib/shared";
import { BattleStage } from "./battle-stage";
import { SiteHeader } from "./site-header";
import { LiveIndicator } from "./live-indicator";
import { useWebSocket } from "@/lib/websocket/client";
import type { WebSocketEvent } from "@/lib/websocket/types";
import { useBattleStore } from "@/lib/battle-store";
import { Settings } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useExclusiveDrawer } from "@/lib/hooks/use-exclusive-drawer";
import { useBattleFeatures } from "@/lib/hooks/use-battle-features";
import { useBattleVote, useBattleComment } from "@/lib/hooks/use-battle-actions";
import { useMobileDrawer } from "@/lib/hooks/use-mobile-drawer";
import { useMobileFooterControls } from "@/lib/hooks/use-mobile-footer-controls";
import { MobileActionButtons, SidebarContainer } from "@/components/battle";

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

  const [hasInitiallyConnected, setHasInitiallyConnected] = useState(false);

  // Mobile drawer state
  const {
    showMobileDrawer,
    mobileActiveTab,
    setShowMobileDrawer,
    setMobileActiveTab,
    openCommentsDrawer,
    openVotingDrawer,
  } = useMobileDrawer();

  // Ensure only one drawer is open at a time across the page
  useExclusiveDrawer(
    "viewer-comments-voting",
    showMobileDrawer,
    setShowMobileDrawer
  );

  // Check if user is admin
  const { sessionClaims, isLoaded } = useAuth();
  const isAdmin = isLoaded && sessionClaims?.metadata?.role === "admin";

  // Feature flags for voting and commenting
  const { showVoting, showCommenting } = useBattleFeatures(battle);

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

  // Fetch latest battle state when WebSocket connects for the FIRST time (for late joiners)
  // Only sync once to avoid resetting user's local state (like votes in localStorage)
  useEffect(() => {
    if (wsStatus === "connected" && !hasInitiallyConnected) {
      console.log("[Viewer] Initial connection - fetching latest battle state");
      setHasInitiallyConnected(true);
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
  }, [wsStatus, hasInitiallyConnected, initialBattle.id, setBattle]);

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

        // On mobile, close the drawer and scroll to scores when voting ends
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          setShowMobileDrawer(false);
        }
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

  // Battle action handlers - MUST be before any conditional returns (Rules of Hooks)
  // For viewer, don't update local state for votes - wait for WebSocket broadcast
  const handleVote = useBattleVote({
    battleId: initialBattle.id,
    onSuccess: () => {
      // Don't update local state - WebSocket will broadcast the update
    },
  });

  const handleCommentSubmit = useBattleComment({
    battle: initialBattle,
    onSuccess: (comment) => {
      // Optimistically update local state immediately (don't wait for WebSocket)
      // This ensures the user sees their comment right away
      if (battle) {
        setBattle({
          ...battle,
          comments: [...battle.comments, comment],
        });
      }
    },
  });

  if (!battle) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SiteHeader />
      <div style={{ height: "var(--header-height)" }} />

      {/* Live Indicator Banner */}
      <div
        className="bg-gray-900 border-b border-gray-800 p-3"
        style={{ height: "var(--live-banner-height)" }}
      >
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

      <div className="px-0 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:h-[calc(100dvh-var(--header-height)-var(--live-banner-height))] md:flex-row">
          {/* Battle Stage */}
          <div className="flex-1 flex flex-col min-h-0">
            <BattleStage
              battle={battle}
              streamingPersonaId={streamingPersonaId}
              streamingText={streamingVerse}
              isReadingPhase={isReadingPhase}
              isVotingPhase={isVotingPhase}
              votingCompletedRound={votingCompletedRound}
              scoreDelaySeconds={5}
              mobileBottomPadding={useMobileFooterControls({
                hasBottomControls: false,
                showCommenting,
                showVoting,
              }).contentPaddingOverride}
            />
          </div>

          {/* Sidebar - Desktop and Mobile */}
          <SidebarContainer
            battle={battle}
            onVote={handleVote}
            onComment={handleCommentSubmit}
            showCommenting={showCommenting}
            showVoting={showVoting}
            isVotingPhase={isVotingPhase}
            votingTimeRemaining={votingTimeRemaining}
            votingCompletedRound={votingCompletedRound}
            showMobileDrawer={showMobileDrawer}
            onMobileDrawerChange={setShowMobileDrawer}
            mobileActiveTab={mobileActiveTab}
          />
        </div>
      </div>

      {/* Mobile Floating Action Buttons */}
      <MobileActionButtons
        showCommenting={showCommenting}
        showVoting={showVoting}
        onCommentsClick={openCommentsDrawer}
        onVotingClick={openVotingDrawer}
        activeTab={mobileActiveTab}
        isDrawerOpen={showMobileDrawer}
        bottomOffset={useMobileFooterControls({
          hasBottomControls: false,
          showCommenting,
          showVoting,
        }).fabBottomOffset}
      />
    </>
  );
}
