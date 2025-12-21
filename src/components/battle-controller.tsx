/**
 * Unified battle controller component - manages battle progression and live mode
 * Handles both regular battles and live battles with WebSocket support
 */

"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  BattleControlBar,
  BattleOptionsDrawer,
  CompletedBattleView,
  SidebarContainer,
} from "@/components/battle";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { getNextPerformer, isRoundComplete } from "@/lib/battle-engine";
import { useBattleStore } from "@/lib/battle-store";
import {
  useBattleComment,
  useBattleVote,
} from "@/lib/hooks/use-battle-actions";
import { useBattleFeatures } from "@/lib/hooks/use-battle-features";
import { useExclusiveDrawer } from "@/lib/hooks/use-exclusive-drawer";
import { useLiveBattleState } from "@/lib/hooks/use-live-battle-state";
import { useMobileDrawer } from "@/lib/hooks/use-mobile-drawer";
import { useNavigationGuard } from "@/lib/hooks/use-navigation-guard";
import { useScoreRevealDelay } from "@/lib/hooks/use-score-reveal-delay";
import type { Battle } from "@/lib/shared";
import { BattleLoading } from "./battle-loading";
import { BattleStage } from "./battle-stage";
import { SiteHeader } from "./site-header";

interface BattleControllerProps {
  initialBattle: Battle;
  /**
   * Delay, in seconds, before revealing scores once available.
   * Default: 5 seconds.
   */
  scoreDelaySeconds?: number;
}

export function BattleController({
  initialBattle,
  scoreDelaySeconds = 2.5,
}: BattleControllerProps) {
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
    cancelBattle,
    isVotingPhase,
    setIsVotingPhase,
    votingCompletedRound,
    setReadingTimeRemaining,
    isReadingPhase,
    setIsReadingPhase,
  } = useBattleStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEndLiveDialog, setShowEndLiveDialog] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isPreGenerating, setIsPreGenerating] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

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
    "mobile-comments-voting",
    showMobileDrawer,
    setShowMobileDrawer
  );
  useExclusiveDrawer(
    "mobile-settings",
    showSettingsDrawer,
    setShowSettingsDrawer
  );

  // Check if user is admin or owner
  const { sessionClaims, isLoaded, userId: clerkUserId } = useAuth();
  const { user } = useUser();
  const isAdmin = isLoaded && sessionClaims?.metadata?.role === "admin";

  // Track user's database ID for ownership check
  const [permissionState, setPermissionState] = useState<{
    loading: boolean;
    dbId: string | null;
  }>({
    loading: true,
    dbId: null,
  });

  // Fetch user's database ID on mount (needed for ownership check)
  useEffect(() => {
    // If auth not loaded yet, keep loading
    if (!isLoaded) return;

    // If no user logged in, stop loading immediately
    if (!user) {
      setPermissionState({ loading: false, dbId: null });
      return;
    }

    // First try from public metadata
    const metadataDbId = user.publicMetadata?.dbUserId as string | undefined;
    if (metadataDbId) {
      setPermissionState({ loading: false, dbId: metadataDbId });
      return;
    }

    // If not in metadata and user is logged in, fetch from API
    // Only fetch if we haven't already found the ID
    if (!permissionState.dbId) {
      fetch("/api/user/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setPermissionState({
            loading: false,
            dbId: data?.user?.id || null,
          });
        })
        .catch((e) => {
          console.error("Failed to fetch user profile:", e);
          setPermissionState((prev) => ({ ...prev, loading: false }));
        });
    }
  }, [user, isLoaded, permissionState.dbId]);

  // Check if user is the battle owner - compare with battle.creator?.userId
  const isOwner = !!(
    permissionState.dbId && battle?.creator?.userId === permissionState.dbId
  );

  // Determine if we are still loading permissions
  // We are loading if auth isn't loaded OR if we are fetching the DB ID
  const isLoadingPermissions = permissionState.loading;

  // User can manage battle if they are admin or owner
  const canManageBattle = isAdmin || isOwner;

  // Feature flags for voting and commenting
  const { showVoting, showCommenting } = useBattleFeatures(battle);

  // Live battle state management
  const {
    wsStatus,
    viewerCount,
    isLive,
    isStartingLive,
    isStoppingLive,
    startLive,
    stopLive,
    votingTimeRemaining,
    beginReadingPhase,
    beginVotingPhase,
    BattleEndedDialog,
    hostEndedBattle,
  } = useLiveBattleState({
    initialBattle,
    canManage: canManageBattle,
    onMobileTabChange: setMobileActiveTab,
    onMobileDrawerOpen: () => setShowMobileDrawer(true),
    onMobileDrawerClose: () => setShowMobileDrawer(false),
  });

  // Automatically switch to voting tab when voting begins (for mobile)
  useEffect(() => {
    if (isVotingPhase) {
      setMobileActiveTab("voting");
      setShowMobileDrawer(true);
    }
  }, [isVotingPhase, setMobileActiveTab, setShowMobileDrawer]);

  // Navigation guard - prevent leaving page during active battle
  // Guard is active when:
  // 1. Battle is paused (in progress)
  // 2. Battle is currently live
  // 3. Battle was recently live (completed but user manages it) - give them a moment
  const guardCondition =
    battle?.status === "paused" ||
    isLive ||
    (battle?.status === "completed" &&
      canManageBattle &&
      initialBattle.isLive === true);

  const { NavigationDialog } = useNavigationGuard({
    when: guardCondition,
    title: isLive ? "End Live Battle?" : "Leave Battle?",
    message: isLive
      ? "This battle is currently live. Leaving will end the broadcast for all viewers."
      : battle?.status === "paused"
      ? "Leave now? We'll pause your match."
      : "Are you sure you want to leave?",
    confirmLabel: isLive ? "End Battle" : "Pause Match",
    onConfirm: async () => {
      if (isLive) {
        await stopLive();
      }
      // Don't need to cancel a completed battle
      if (battle && battle.status !== "completed") {
        setIsLeaving(true);
        await cancelBattle();
      }
    },
  });

  // Voting phase timer effect - starts when round is complete in LIVE battles only
  // Non-live battles allow users to vote at their leisure without a countdown
  useEffect(() => {
    if (!battle) return;

    const roundComplete = isRoundComplete(battle, battle.currentRound);
    const nextPerformer = getNextPerformer(battle);

    // Start voting phase with countdown ONLY for live battles
    // Non-live battles show the voting UI in the sidebar without forcing a countdown
    if (
      isLive &&
      roundComplete &&
      !nextPerformer &&
      battle.status === "paused" &&
      !isReadingPhase &&
      !isVotingPhase &&
      votingCompletedRound !== battle.currentRound &&
      showVoting
    ) {
      // Start reading phase first (showing "Begin Voting" button)
      // This gives the host control over when to actually start the voting timer
      beginReadingPhase(20);
    }
  }, [
    battle,
    isLive,
    isReadingPhase,
    isVotingPhase,
    beginReadingPhase,
    beginVotingPhase,
    votingCompletedRound,
    showVoting,
  ]);

  // Score reveal delay (shared logic) to drive "Calculating Score..." on the button
  const currentRoundScore =
    battle?.scores.find((s) => s.round === battle.currentRound) || null;
  const scoresAvailableRound =
    currentRoundScore && !isReadingPhase && !isVotingPhase
      ? currentRoundScore.round
      : null;
  const { isDelaying: isCalculatingScores } = useScoreRevealDelay(
    scoresAvailableRound,
    scoreDelaySeconds,
    battle?.id
  );

  // Battle action handlers
  const handleVote = useBattleVote({
    battleId: battle?.id || "",
    onSuccess: (updatedBattle) => {
      // For live mode, don't update locally - wait for WebSocket
      if (!isLive) {
        setBattle(updatedBattle);
      }
    },
  });

  const handleCommentSubmit = useBattleComment({
    battle,
    onSuccess: (comment) => {
      // Optimistically update for both live and non-live
      if (battle) {
        setBattle({
          ...battle,
          comments: [...battle.comments, comment],
        });
      }
    },
  });

  // Handler to manually start voting phase
  const handleBeginVoting = () => {
    if (!showVoting) return;
    beginVotingPhase(10);
  };

  // Handler to toggle voting on/off
  const handleToggleVoting = useCallback(
    async (enabled: boolean) => {
      if (!battle) return;
      const updatedBattle = { ...battle, votingEnabled: enabled };
      setBattle(updatedBattle);
      await saveBattle();
    },
    [battle, setBattle, saveBattle]
  );

  // Handler to toggle commenting on/off
  const handleToggleCommenting = useCallback(
    async (enabled: boolean) => {
      if (!battle) return;
      const updatedBattle = { ...battle, commentsEnabled: enabled };
      setBattle(updatedBattle);
      await saveBattle();
    },
    [battle, setBattle, saveBattle]
  );

  // Generate verse - handles both local and live modes
  const handleGenerateVerse = useCallback(async () => {
    const { battle: latestBattle } = useBattleStore.getState();
    if (!latestBattle) return;
    const nextPerformer = getNextPerformer(latestBattle);
    if (!nextPerformer || isGenerating) return;

    const personaId = latestBattle.personas[nextPerformer].id;
    const position = nextPerformer;

    setIsPreGenerating(false);
    setIsGenerating(true);
    setStreamingVerse(null, personaId, position);

    try {
      const response = await fetch("/api/battle/generate-verse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battle: latestBattle,
          personaId,
          isLive: isLive, // Pass live flag to enable WebSocket broadcasting
        }),
      });

      if (!response.ok) throw new Error("Failed to generate verse");

      if (isLive) {
        // For live mode, just wait for server to finish - WebSocket handles UI updates
        await response.text();
      } else {
        // For non-live mode, handle local streaming display
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullVerse = "";
        let displayedVerse = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullVerse += decoder.decode(value);
          }
        }

        // Display word by word
        const WORD_DELAY = 100;
        const tokens = fullVerse.split(/(\s+)/);

        for (let i = 0; i < tokens.length; i++) {
          displayedVerse += tokens[i];
          setStreamingVerse(displayedVerse, personaId, position);
          if (tokens[i].trim()) {
            await new Promise((resolve) => setTimeout(resolve, WORD_DELAY));
          }
        }

        setStreamingVerse(fullVerse, personaId, position);
        addVerse(personaId, fullVerse);
        setStreamingVerse(null, null, null);
        await saveBattle();
      }
    } catch (error) {
      console.error("Error generating verse:", error);
      setStreamingVerse(null, null, null);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, setStreamingVerse, addVerse, saveBattle, isLive]);

  const handleAdvanceRound = useCallback(async () => {
    setIsReadingPhase(false);
    setReadingTimeRemaining(null);
    setIsVotingPhase(false);

    const willAutoStart =
      (useBattleStore.getState().battle?.autoStartOnAdvance ?? true) !== false;
    if (willAutoStart) {
      setIsPreGenerating(true);
    }

    advanceRound();
    await saveBattle();

    const { battle: latestBattle } = useBattleStore.getState();
    if (latestBattle?.autoStartOnAdvance !== false) {
      await handleGenerateVerse();
    }
  }, [
    advanceRound,
    saveBattle,
    handleGenerateVerse,
    setIsReadingPhase,
    setReadingTimeRemaining,
    setIsVotingPhase,
  ]);

  const handleCancelBattle = () => {
    setShowCancelDialog(true);
    setCancelError(null);
  };

  // Handler to show end live confirmation dialog
  const handleEndLiveClick = () => {
    setShowEndLiveDialog(true);
  };

  // Confirm ending live broadcast
  const confirmEndLive = async () => {
    try {
      await stopLive();
      setShowEndLiveDialog(false);
    } catch (error) {
      console.error("Error ending live:", error);
    }
  };

  const confirmCancelBattle = async () => {
    setIsCanceling(true);
    setIsLeaving(true);
    setCancelError(null);
    try {
      if (isLive) {
        await stopLive();
      }
      await cancelBattle();

      const redirectUserId = permissionState.dbId;

      const targetUrl = redirectUserId ? `/profile/${redirectUserId}` : "/";
      window.location.href = targetUrl;
    } catch (error) {
      console.error("Error canceling battle:", error);
      setCancelError("Failed to cancel battle. Please try again.");
      setIsCanceling(false);
      setIsLeaving(false);
    }
  };

  if (!battle || isLeaving) {
    return <BattleLoading />;
  }

  const nextPerformer = getNextPerformer(battle);
  const roundComplete = isRoundComplete(battle, battle.currentRound);
  const canGenerate =
    nextPerformer && !isGenerating && battle.status === "paused";
  const canAdvance =
    roundComplete &&
    !nextPerformer &&
    battle.status === "paused" &&
    !isReadingPhase &&
    !isVotingPhase;

  // Completed battle - show replay mode
  if (battle.status === "completed") {
    return (
      <CompletedBattleView
        battle={battle}
        isAdmin={isAdmin}
        dbUserId={permissionState.dbId}
        showCommenting={showCommenting}
        showVoting={showVoting}
        votingCompletedRound={votingCompletedRound}
        showMobileDrawer={showMobileDrawer}
        setShowMobileDrawer={setShowMobileDrawer}
        mobileActiveTab={mobileActiveTab}
        openCommentsDrawer={openCommentsDrawer}
        openVotingDrawer={openVotingDrawer}
        onVote={handleVote}
        onComment={handleCommentSubmit}
        onToggleCommenting={handleToggleCommenting}
        onToggleVoting={handleToggleVoting}
      />
    );
  }

  const showControlBar = battle.status === "paused";
  const pauseLabel = isGenerating ? "Spittin' lyrics..." : "Pausing...";

  return (
    <>
      <SiteHeader
        activeBattleState={{
          isLive: isLive,
          viewerCount: viewerCount,
          connectionStatus: wsStatus,
          canManageLive: canManageBattle,
          onDisconnect: handleEndLiveClick,
        }}
      />
      <div style={{ height: "var(--header-height)" }} />

      <div className="px-0 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col h-[calc(100dvh-var(--header-height))] md:flex-row">
          {/* Main Battle Stage */}
          <div className="flex-1 flex flex-col min-h-0">
            <BattleStage
              battle={battle}
              streamingPersonaId={streamingPersonaId}
              streamingText={streamingVerse}
              streamingPosition={streamingPosition}
              isReadingPhase={isReadingPhase}
              isVotingPhase={isVotingPhase}
              votingCompletedRound={votingCompletedRound}
              scoreDelaySeconds={scoreDelaySeconds}
              isLive={isLive}
              liveConnectionStatus={wsStatus}
              liveViewerCount={viewerCount}
              canManageLive={canManageBattle}
              onDisconnect={handleEndLiveClick}
            />

            {/* Battle Control Bar - always visible during active battles */}
            {battle.status === "paused" && (
              <BattleControlBar
                battle={battle}
                isGenerating={isGenerating}
                isCanceling={isCanceling}
                canGenerate={!!canGenerate}
                canAdvance={!!canAdvance}
                isReadingPhase={isReadingPhase}
                isVotingPhase={isVotingPhase}
                isCalculatingScores={isCalculatingScores}
                isPreGenerating={isPreGenerating}
                votingTimeRemaining={votingTimeRemaining}
                showVoting={showVoting}
                showCommenting={showCommenting}
                nextPerformerName={
                  nextPerformer
                    ? battle.personas[nextPerformer].name
                    : undefined
                }
                isAdmin={isAdmin}
                isLive={isLive}
                canManageLive={canManageBattle}
                isLoadingPermissions={isLoadingPermissions}
                isStartingLive={isStartingLive}
                isStoppingLive={isStoppingLive}
                hostEndedBattle={hostEndedBattle}
                onGoLive={startLive}
                onEndLive={handleEndLiveClick}
                onGenerateVerse={handleGenerateVerse}
                onAdvanceRound={handleAdvanceRound}
                onBeginVoting={handleBeginVoting}
                onCancelBattle={handleCancelBattle}
                onToggleVoting={handleToggleVoting}
                onToggleCommenting={handleToggleCommenting}
                onCommentsClick={openCommentsDrawer}
                onVotingClick={openVotingDrawer}
                mobileActiveTab={mobileActiveTab}
                isMobileDrawerOpen={showMobileDrawer}
                onSettingsClick={() => setShowSettingsDrawer(true)}
                settingsActive={showSettingsDrawer}
                pauseLabel={pauseLabel}
              />
            )}
          </div>

          {/* Sidebar for comments/voting */}
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
            excludeBottomControls
          />
        </div>
      </div>

      <BattleOptionsDrawer
        open={showSettingsDrawer}
        onOpenChange={setShowSettingsDrawer}
        showCommenting={showCommenting}
        showVoting={showVoting}
        onToggleCommenting={handleToggleCommenting}
        onToggleVoting={handleToggleVoting}
        onPauseBattle={handleCancelBattle}
        isPausing={isCanceling || isGenerating}
        pauseLabel={pauseLabel}
        isLive={isLive}
      />

      {/* Pause/End Battle Dialog */}
      <ConfirmationDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title={isLive ? "End Live Battle?" : "Pause Battle?"}
        description={
          isLive
            ? "This will end the live broadcast for all viewers."
            : "Pause the battle? You can resume later."
        }
        confirmLabel={isLive ? "End Live" : "Pause Battle"}
        cancelLabel="Keep Going"
        onConfirm={confirmCancelBattle}
        isLoading={isCanceling}
        variant="warning"
        icon={AlertTriangle}
        errorMessage={cancelError || undefined}
      />

      {/* End Live Confirmation Dialog */}
      <ConfirmationDialog
        open={showEndLiveDialog}
        onOpenChange={setShowEndLiveDialog}
        title="End Live Broadcast?"
        description="This will end the live broadcast for all viewers. The battle will continue but won't be streamed."
        confirmLabel="End Live"
        cancelLabel="Keep Broadcasting"
        onConfirm={confirmEndLive}
        isLoading={isStoppingLive}
        variant="warning"
        icon={AlertTriangle}
      />

      {/* Navigation Guard Dialog */}
      <NavigationDialog />

      {/* Battle Ended Dialog (for viewers) */}
      <BattleEndedDialog />
    </>
  );
}
