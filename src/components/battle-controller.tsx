/**
 * Battle controller component - manages battle progression
 */

"use client";

import { useState, useEffect } from "react";
import type { Battle } from "@/lib/shared";
import { BattleStage } from "./battle-stage";
import { BattleReplay } from "./battle-replay";
import { BattleSidebar } from "./battle-sidebar";
import { SiteHeader } from "./site-header";
import { BattleLoading } from "./battle-loading";
import { useBattleStore } from "@/lib/battle-store";
import { getNextPerformer, isRoundComplete } from "@/lib/battle-engine";
import {
  Play,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  Pause,
  Settings,
  CheckCircle,
} from "lucide-react";
import { useNavigationGuard } from "@/lib/hooks/use-navigation-guard";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { BattleDrawer } from "@/components/ui/battle-drawer";

interface BattleControllerProps {
  initialBattle: Battle;
}

export function BattleController({ initialBattle }: BattleControllerProps) {
  const {
    battle,
    setBattle,
    addVerse,
    advanceRound,
    setStreamingVerse,
    streamingVerse,
    streamingPersonaId,
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
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<"comments" | "voting">(
    "comments"
  );
  const [isLeaving, setIsLeaving] = useState(false);

  // Check if user is admin
  const { sessionClaims, isLoaded } = useAuth();
  const isAdmin = isLoaded && sessionClaims?.metadata?.role === "admin";

  // Determine if voting and commenting should be shown
  // Check both env flags (master switch) AND battle settings
  const isVotingGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_VOTING !== "false";
  const isCommentsGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_COMMENTING !== "false";
  const showVoting = isVotingGloballyEnabled && (battle?.votingEnabled ?? true);
  const showCommenting =
    isCommentsGloballyEnabled && (battle?.commentsEnabled ?? true);

  // Automatically switch to voting tab when voting begins (for mobile)
  useEffect(() => {
    if (isVotingPhase) {
      setMobileActiveTab("voting");
      // Also open the drawer on mobile to make voting more visible
      setShowMobileDrawer(true);
    }
  }, [isVotingPhase]);

  // Navigation guard - prevent leaving page during ongoing battle
  const { NavigationDialog } = useNavigationGuard({
    when: battle?.status === "ongoing",
    title: "Pause Battle?",
    message: "Leave now? We'll pause your match.",
    onConfirm: async () => {
      if (battle) {
        setIsLeaving(true);
        await cancelBattle();
        // Redirect to the battle page itself (it will show as completed/paused)
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
      battle.status === "ongoing" &&
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
    const nextPerformer = getNextPerformer(battle);
    if (!nextPerformer || isGenerating) return;

    const personaId = battle.personas[nextPerformer].id;
    setIsGenerating(true);
    setStreamingVerse(null, personaId);

    try {
      const response = await fetch("/api/battle/generate-verse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battle,
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
        setStreamingVerse(displayedVerse, personaId);

        // Only delay on actual words (not whitespace)
        if (tokens[i].trim()) {
          await new Promise((resolve) => setTimeout(resolve, WORD_DELAY));
        }
      }

      // Ensure the full verse is displayed
      setStreamingVerse(fullVerse, personaId);

      // Add completed verse to battle
      addVerse(personaId, fullVerse);
      setStreamingVerse(null, null);

      // Save battle state
      await saveBattle();
    } catch (error) {
      console.error("Error generating verse:", error);
      setStreamingVerse(null, null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVote = async (
    round: number,
    personaId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/battle/${battle.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round,
          personaId,
        }),
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

      // Update local battle state with the new comment
      setBattle({
        ...battle,
        comments: [...battle.comments, comment],
      });
    } catch (error) {
      console.error("Error commenting:", error);
    }
  };

  const handleAdvanceRound = async () => {
    // Reset both reading and voting phases when advancing
    setIsReadingPhase(false);
    setReadingTimeRemaining(null);
    setIsVotingPhase(false);
    setVotingTimeRemaining(null);
    advanceRound();
    await saveBattle();
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
      // Redirect to the battle page itself (it will show as paused)
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
    nextPerformer && !isGenerating && battle.status === "ongoing";
  const canAdvance =
    roundComplete &&
    !nextPerformer &&
    battle.status === "ongoing" &&
    !isReadingPhase &&
    !isVotingPhase;

  const handleMobileCommentsClick = () => {
    setMobileActiveTab("comments");
    setShowMobileDrawer(true);
  };

  const handleMobileVotingClick = () => {
    setMobileActiveTab("voting");
    setShowMobileDrawer(true);
  };

  // If battle is completed or incomplete, use full replay mode
  if (battle.status === "completed" || battle.status === "incomplete") {
    return (
      <>
        <SiteHeader />
        <div style={{ height: "var(--header-height)" }} />
        <div className="flex flex-col h-[calc(100vh-var(--header-height))] md:flex-row">
          {/* Main Stage */}
          <div className="flex-1 flex flex-col min-h-0">
            <BattleReplay battle={battle} />

            {/* Resume Button for Incomplete Battles */}
            {battle.status === "incomplete" && (
              <div className="p-4 pb-24 md:pb-4 bg-gray-900 border-t border-gray-800">
                <div className="max-w-4xl mx-auto">
                  <button
                    onClick={handleResumeBattle}
                    disabled={isResuming}
                    className="w-full md:w-auto px-6 py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all mx-auto"
                  >
                    {isResuming ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resuming...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-5 h-5" />
                        Resume Battle
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Sidebar */}
          {(showCommenting || showVoting) && (
            <div className="hidden md:block w-96">
              <BattleSidebar
                battle={battle}
                onVote={handleVote}
                onComment={handleComment}
                isArchived={true}
                votingCompletedRound={votingCompletedRound}
              />
            </div>
          )}
        </div>

        {/* Mobile Floating Action Buttons */}
        {(showCommenting || showVoting) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-row items-center gap-3 md:hidden z-40">
            {showCommenting && (
              <button
                onClick={handleMobileCommentsClick}
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
            )}
            {showVoting && (
              <button
                onClick={handleMobileVotingClick}
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
            )}
          </div>
        )}

        {/* Mobile Drawer */}
        <BattleDrawer
          open={showMobileDrawer}
          onOpenChange={setShowMobileDrawer}
          title={mobileActiveTab === "comments" ? "Comments" : "Voting"}
        >
          <div className="flex-1 overflow-y-auto min-h-0">
            <BattleSidebar
              battle={battle}
              onVote={handleVote}
              onComment={handleComment}
              isArchived={true}
              votingCompletedRound={votingCompletedRound}
              defaultTab={mobileActiveTab}
            />
          </div>
        </BattleDrawer>
      </>
    );
  }

  // Live battle mode
  return (
    <>
      <SiteHeader />
      <div style={{ height: "var(--header-height)" }} />
      <div className="flex flex-col h-[calc(100vh-var(--header-height))] md:flex-row">
        {/* Main Stage */}
        <div className="flex-1 flex flex-col min-h-0">
          <BattleStage
            battle={battle}
            streamingPersonaId={streamingPersonaId}
            streamingText={streamingVerse}
            isReadingPhase={isReadingPhase}
            isVotingPhase={isVotingPhase}
            votingCompletedRound={votingCompletedRound}
          />

          {/* Control Bar - Always visible during ongoing battles */}
          {battle.status === "ongoing" && (
            <div
              className={`p-4 ${
                showCommenting || showVoting ? "pb-24 md:pb-4" : "pb-4"
              } bg-gray-900 border-t border-gray-800`}
            >
              <div className="max-w-4xl mx-auto flex flex-row gap-3">
                {/* Primary Action Button - Changes based on state */}
                <button
                  onClick={
                    isReadingPhase && showVoting
                      ? handleBeginVoting
                      : canAdvance
                      ? handleAdvanceRound
                      : canGenerate
                      ? handleGenerateVerse
                      : undefined
                  }
                  disabled={
                    isGenerating ||
                    isVotingPhase ||
                    (!canGenerate &&
                      !canAdvance &&
                      !(isReadingPhase && showVoting))
                  }
                  className={`
                    flex-1 px-2 py-2 rounded-lg text-white font-bold transition-all
                    ${
                      isReadingPhase
                        ? "bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                        : isVotingPhase
                        ? "bg-linear-to-r from-purple-600 to-pink-600 animate-pulse"
                        : canAdvance
                        ? "bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-pulse"
                        : battle.verses.length === 0
                        ? "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        : "bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    }
                    ${
                      isGenerating ||
                      isVotingPhase ||
                      (!canGenerate && !canAdvance && !isReadingPhase)
                        ? "cursor-not-allowed"
                        : ""
                    }
                  `}
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Kicking ballistics...
                    </div>
                  ) : isReadingPhase && showVoting ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-lg font-medium">Begin Voting</span>
                    </div>
                  ) : isVotingPhase &&
                    votingTimeRemaining !== null &&
                    showVoting ? (
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⏱️</span>
                        <span className="text-lg font-medium">Vote Now!</span>
                        <span className="text-2xl font-bebas-neue">
                          {votingTimeRemaining}s
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-1 max-w-md">
                        <span className="text-sm text-white/80 whitespace-nowrap">
                          Vote in the sidebar →
                        </span>
                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden min-w-[100px]">
                          <div
                            className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                            style={{
                              width: `${(votingTimeRemaining / 10) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : canAdvance ? (
                    <div className="flex items-center justify-center gap-2">
                      <ArrowRight className="w-5 h-5" />
                      {battle.currentRound === 3
                        ? "Reveal Winner"
                        : "Next Round"}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Play className="w-5 h-5" />
                      {battle.verses.length === 0 ? "First up:" : "Next:"}{" "}
                      {nextPerformer && battle.personas[nextPerformer].name}
                    </div>
                  )}
                </button>

                {/* Pause Battle Button */}
                <button
                  onClick={handleCancelBattle}
                  disabled={isCanceling || isGenerating}
                  className="px-3 sm:px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Pause className="w-5 h-5" />
                  <span className="hidden sm:inline">Pause Battle</span>
                </button>

                {/* Admin Control Panel Link */}
                {isAdmin && (
                  <Link
                    href={`/admin/battles/${battle.id}/control`}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="hidden sm:inline">Live Controls</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        {(showCommenting || showVoting) && (
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
        )}
      </div>

      {/* Mobile Floating Action Buttons */}
      {(showCommenting || showVoting) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-row items-center gap-3 md:hidden z-40">
          {showCommenting && (
            <button
              onClick={handleMobileCommentsClick}
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
          )}
          {showVoting && (
            <button
              onClick={handleMobileVotingClick}
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
          )}
        </div>
      )}

      {/* Mobile Drawer */}
      <BattleDrawer
        open={showMobileDrawer}
        onOpenChange={setShowMobileDrawer}
        title={mobileActiveTab === "comments" ? "Comments" : "Voting"}
      >
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
      </BattleDrawer>

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
