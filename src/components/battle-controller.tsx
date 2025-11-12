/**
 * Battle controller component - manages battle progression
 */

"use client";

import { useState, useEffect, useRef } from "react";
import type { Battle } from "@/lib/shared";
import { BattleStage } from "./battle-stage";
import { BattleReplay } from "./battle-replay";
import { useMobileFooterControls } from "@/lib/hooks/use-mobile-footer-controls";
import { SiteHeader } from "./site-header";
import { BattleLoading } from "./battle-loading";
import { useBattleStore } from "@/lib/battle-store";
import { getNextPerformer, isRoundComplete } from "@/lib/battle-engine";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { useNavigationGuard } from "@/lib/hooks/use-navigation-guard";
import { useAuth } from "@clerk/nextjs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useExclusiveDrawer } from "@/lib/hooks/use-exclusive-drawer";
import { useBattleFeatures } from "@/lib/hooks/use-battle-features";
import {
  useBattleVote,
  useBattleComment,
} from "@/lib/hooks/use-battle-actions";
import { useMobileDrawer } from "@/lib/hooks/use-mobile-drawer";
import {
  MobileActionButtons,
  SidebarContainer,
  BattleControlBar,
} from "@/components/battle";
import { useScoreRevealDelay } from "@/lib/hooks/use-score-reveal-delay";

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
  scoreDelaySeconds = 5,
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
    resumeBattle,
    votingTimeRemaining,
    setVotingTimeRemaining,
    isVotingPhase,
    setIsVotingPhase,
    votingCompletedRound,
    completeVotingPhase,
    readingTimeRemaining,
    setReadingTimeRemaining,
    isReadingPhase,
    setIsReadingPhase,
  } = useBattleStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isPreGenerating, setIsPreGenerating] = useState(false);

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

  // Check if user is admin
  const { sessionClaims, isLoaded } = useAuth();
  const isAdmin = isLoaded && sessionClaims?.metadata?.role === "admin";

  // Feature flags for voting and commenting
  const { showVoting, showCommenting } = useBattleFeatures(battle);

  // Automatically switch to voting tab when voting begins (for mobile)
  useEffect(() => {
    if (isVotingPhase) {
      setMobileActiveTab("voting");
      // Open drawer - CSS (md:hidden) ensures it only shows on mobile
      setShowMobileDrawer(true);
    }
  }, [isVotingPhase]);

  // Navigation guard - prevent leaving page during paused battle
  const { NavigationDialog } = useNavigationGuard({
    when: battle?.status === "paused",
    title: "Pause Battle?",
    message: "Leave now? We'll pause your match.",
    onConfirm: async () => {
      if (battle) {
        setIsLeaving(true);
        await cancelBattle();
        // Redirect to the battle page itself
        window.location.href = `/battle/${battle.id}`;
      }
    },
  });

  useEffect(() => {
    setBattle(initialBattle);
  }, [initialBattle, setBattle]);

  // Reading phase timer effect - starts when round is complete
  useEffect(() => {
    if (!battle) return;

    const roundComplete = isRoundComplete(battle, battle.currentRound);
    const nextPerformer = getNextPerformer(battle);

    // Start reading phase when round is complete and we're not already in reading/voting phase
    // Only start reading phase if voting is enabled
    if (
      roundComplete &&
      !nextPerformer &&
      battle.status === "paused" &&
      !isReadingPhase &&
      !isVotingPhase &&
      votingCompletedRound !== battle.currentRound &&
      showVoting
    ) {
      setIsReadingPhase(true);
    }
  }, [
    battle,
    isReadingPhase,
    isVotingPhase,
    setIsReadingPhase,
    votingCompletedRound,
    showVoting,
  ]);

  // Voting countdown timer effect
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
    setIsVotingPhase,
    battle,
  ]);

  // Score reveal delay (shared logic) to drive "Calculating Score..." on the button
  const currentRoundScore =
    battle?.scores.find((s) => s.round === battle.currentRound) || null;
  const scoresAvailableRound =
    currentRoundScore && !isReadingPhase && !isVotingPhase
      ? currentRoundScore.round
      : null;
  const { revealedRound: revealedByDelay, isDelaying: isCalculatingScores } =
    useScoreRevealDelay(scoresAvailableRound, scoreDelaySeconds);

  // Battle action handlers - MUST be before any conditional returns (Rules of Hooks)
  const handleVote = useBattleVote({
    battleId: battle?.id || "",
    onSuccess: (updatedBattle) => setBattle(updatedBattle),
  });

  const handleCommentSubmit = useBattleComment({
    battle,
    onSuccess: (comment) => {
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
    if (!showVoting) return; // Don't start voting if it's disabled
    setIsReadingPhase(false);
    setReadingTimeRemaining(null);
    setIsVotingPhase(true);
    setVotingTimeRemaining(10); // 10 seconds for voting
  };

  if (!battle || isLeaving) {
    return <BattleLoading />;
  }

  const handleGenerateVerse = async () => {
    const { battle: latestBattle } = useBattleStore.getState();
    if (!latestBattle) return;
    const nextPerformer = getNextPerformer(latestBattle);
    if (!nextPerformer || isGenerating) return;

    const personaId = latestBattle.personas[nextPerformer].id;
    // Use nextPerformer directly as the position (it's already 'player1' or 'player2')
    const position = nextPerformer;
    // Clear any pre-generating visual state as real generation begins
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
        }),
      });

      if (!response.ok) throw new Error("Failed to generate verse");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullVerse = "";
      let displayedVerse = "";

      // First, buffer all incoming chunks
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullVerse += chunk;
        }
      }

      // Now display the verse word by word at a controlled speed
      const WORD_DELAY = 100; // Delay in milliseconds between words (100ms = 10 words per second)

      // Split text while preserving whitespace and newlines
      const tokens = fullVerse.split(/(\s+)/);

      for (let i = 0; i < tokens.length; i++) {
        displayedVerse += tokens[i];
        setStreamingVerse(displayedVerse, personaId, position);

        // Only delay on actual words (not whitespace)
        if (tokens[i].trim()) {
          await new Promise((resolve) => setTimeout(resolve, WORD_DELAY));
        }
      }

      // Ensure the full verse is displayed
      setStreamingVerse(fullVerse, personaId, position);

      // Add completed verse to battle
      addVerse(personaId, fullVerse);
      setStreamingVerse(null, null, null);

      // Save battle state
      await saveBattle();
    } catch (error) {
      console.error("Error generating verse:", error);
      setStreamingVerse(null, null, null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvanceRound = async () => {
    // Reset both reading and voting phases when advancing
    setIsReadingPhase(false);
    setReadingTimeRemaining(null);
    setIsVotingPhase(false);
    setVotingTimeRemaining(null);
    // If auto-start is enabled, set a pre-generating visual state immediately to avoid flicker
    const willAutoStart =
      (useBattleStore.getState().battle?.autoStartOnAdvance ?? true) !== false;
    if (willAutoStart) {
      setIsPreGenerating(true);
    }
    advanceRound();
    await saveBattle();
    // Auto-start first verse on round advance if enabled (default true)
    const { battle: latestBattle } = useBattleStore.getState();
    if (latestBattle?.autoStartOnAdvance !== false) {
      // Trigger generation for the first artist in the new round
      await handleGenerateVerse();
    }
  };

  const handleCancelBattle = () => {
    setShowCancelDialog(true);
    setCancelError(null);
  };

  const confirmCancelBattle = async () => {
    setIsCanceling(true);
    setIsLeaving(true);
    setCancelError(null);
    try {
      await cancelBattle();
      // Redirect to the battle page itself
      window.location.href = `/battle/${battle.id}`;
    } catch (error) {
      console.error("Error canceling battle:", error);
      setCancelError("Failed to cancel battle. Please try again.");
      setIsCanceling(false);
      setIsLeaving(false);
    }
  };

  const handleResumeBattle = async () => {
    setIsResuming(true);
    try {
      await resumeBattle();
      // The battle state will update automatically via the store
    } catch (error) {
      console.error("Error resuming battle:", error);
      alert("Failed to resume battle. Please try again.");
    } finally {
      setIsResuming(false);
    }
  };

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

  // If battle is completed, use full replay mode
  if (battle.status === "completed") {
    const { contentPaddingOverride, fabBottomOffset } = useMobileFooterControls(
      {
        hasBottomControls: true,
        showCommenting,
        showVoting,
      }
    );
    return (
      <>
        <SiteHeader />
        <div style={{ height: "var(--header-height)" }} />
        <div className="px-0 md:px-6">
          <div className="max-w-7xl mx-auto flex flex-col h-[calc(100dvh-var(--header-height))] md:flex-row">
            {/* Main Stage */}
            <div className="flex-1 flex flex-col min-h-0">
              <BattleReplay
                battle={battle}
                mobileBottomPadding={contentPaddingOverride}
              />
            </div>

            {/* Sidebar - Desktop and Mobile */}
            <SidebarContainer
              battle={battle}
              onVote={handleVote}
              onComment={handleCommentSubmit}
              showCommenting={showCommenting}
              showVoting={showVoting}
              isArchived={true}
              votingCompletedRound={votingCompletedRound}
              showMobileDrawer={showMobileDrawer}
              onMobileDrawerChange={setShowMobileDrawer}
              mobileActiveTab={mobileActiveTab}
              excludeBottomControls={battle.status === "completed"}
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
          bottomOffset={fabBottomOffset}
        />
      </>
    );
  }

  // Live battle mode
  const { contentPaddingOverride } = useMobileFooterControls({
    hasBottomControls: false,
    showCommenting,
    showVoting,
  });

  // Custom offset for FABs to sit above the battle control bar
  const liveBattleFabOffset =
    showCommenting || showVoting
      ? "calc(var(--battle-control-bar-height) + var(--fab-gutter))"
      : undefined;

  return (
    <>
      <SiteHeader />
      <div style={{ height: "var(--header-height)" }} />
      <div className="px-0 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col h-[calc(100dvh-var(--header-height))] md:flex-row">
          {/* Main Stage */}
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
              mobileBottomPadding={contentPaddingOverride}
            />

            {/* Control Bar - Always visible during paused battles */}
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
                nextPerformerName={
                  nextPerformer
                    ? battle.personas[nextPerformer].name
                    : undefined
                }
                isAdmin={isAdmin}
                onGenerateVerse={handleGenerateVerse}
                onAdvanceRound={handleAdvanceRound}
                onBeginVoting={handleBeginVoting}
                onCancelBattle={handleCancelBattle}
              />
            )}
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
        bottomOffset={liveBattleFabOffset}
      />

      {/* Pause Battle Dialog */}
      <ConfirmationDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Pause Battle?"
        description="Pause the battle? You can resume later."
        confirmLabel="Pause Battle"
        cancelLabel="Keep Playing"
        onConfirm={confirmCancelBattle}
        isLoading={isCanceling}
        variant="warning"
        icon={AlertTriangle}
        errorMessage={cancelError || undefined}
      />

      {/* Navigation Guard Dialog */}
      <NavigationDialog />
    </>
  );
}
