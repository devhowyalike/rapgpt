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
  XCircle,
  RotateCcw,
  AlertTriangle,
  X,
  MessageSquare,
  ThumbsUp,
  Pause,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigationGuard } from "@/lib/hooks/use-navigation-guard";

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
    if (
      roundComplete &&
      !nextPerformer &&
      battle.status === "ongoing" &&
      !isReadingPhase &&
      !isVotingPhase &&
      votingCompletedRound !== battle.currentRound
    ) {
      setIsReadingPhase(true);
      setReadingTimeRemaining(20); // 20 seconds to read the verse
    }
  }, [
    battle,
    isReadingPhase,
    isVotingPhase,
    setIsReadingPhase,
    setReadingTimeRemaining,
    votingCompletedRound,
  ]);

  // Reading countdown timer effect
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
        // Reading phase complete, start voting phase
        setIsReadingPhase(false);
        setReadingTimeRemaining(null);
        setIsVotingPhase(true);
        setVotingTimeRemaining(10); // 10 seconds for voting
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    readingTimeRemaining,
    isReadingPhase,
    setReadingTimeRemaining,
    setIsReadingPhase,
    setIsVotingPhase,
    setVotingTimeRemaining,
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
        <div style={{ height: "52px" }} />
        <div className="flex flex-col md:h-[calc(100vh-3.5rem)] md:flex-row">
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
          <div className="hidden md:block w-96">
            <BattleSidebar
              battle={battle}
              onVote={handleVote}
              onComment={handleComment}
              isArchived={true}
              votingCompletedRound={votingCompletedRound}
            />
          </div>
        </div>

        {/* Mobile Floating Action Buttons */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-row items-center gap-3 md:hidden z-40">
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
                  isArchived={true}
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

  // Live battle mode
  return (
    <>
      <SiteHeader />
      <div style={{ height: "52px" }} />
      <div className="flex flex-col md:h-[calc(100vh-3.5rem)] md:flex-row">
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
            <div className="p-4 pb-24 md:pb-4 bg-gray-900 border-t border-gray-800">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
                {/* Primary Action Button - Changes based on state */}
                <button
                  onClick={
                    canAdvance
                      ? handleAdvanceRound
                      : canGenerate
                      ? handleGenerateVerse
                      : undefined
                  }
                  disabled={
                    isGenerating ||
                    isReadingPhase ||
                    isVotingPhase ||
                    (!canGenerate && !canAdvance)
                  }
                  className={`
                    flex-1 px-6 py-3 rounded-lg text-white font-bold transition-all
                    ${
                      isReadingPhase
                        ? "bg-linear-to-r from-cyan-600 to-blue-600"
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
                      isReadingPhase ||
                      isVotingPhase ||
                      (!canGenerate && !canAdvance)
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
                  ) : isReadingPhase && readingTimeRemaining !== null ? (
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📖</span>
                        <span className="text-lg font-medium">
                          Read the source...
                        </span>
                        <span className="text-2xl font-bebas-neue">
                          {readingTimeRemaining}s
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-1 max-w-md">
                        <span className="text-sm text-white/80 whitespace-nowrap">
                          Voting in {readingTimeRemaining}s
                        </span>
                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden min-w-[100px]">
                          <div
                            className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                            style={{
                              width: `${(readingTimeRemaining / 20) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : isVotingPhase && votingTimeRemaining !== null ? (
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
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Pause className="w-5 h-5" />
                  Pause Battle
                </button>
              </div>
            </div>
          )}
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

      {/* Pause Battle Dialog */}
      <Dialog.Root open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-xl font-bold text-white mb-2">
                  Pause Battle?
                </Dialog.Title>
                <Dialog.Description className="text-gray-400 mb-4">
                  Pause the battle? You can resume later.
                </Dialog.Description>

                {cancelError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {cancelError}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      disabled={isCanceling}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                    >
                      Keep Playing
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={confirmCancelBattle}
                    disabled={isCanceling}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
                  >
                    {isCanceling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Pausing...
                      </>
                    ) : (
                      "Pause Battle"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Navigation Guard Dialog */}
      <NavigationDialog />
    </>
  );
}
