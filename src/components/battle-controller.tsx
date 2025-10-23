/**
 * Battle controller component - manages battle progression
 */

"use client";

import { useState, useEffect } from "react";
import type { Battle } from "@/lib/shared";
import { BattleStage } from "./battle-stage";
import { BattleReplay } from "./battle-replay";
import { BattleSidebar } from "./battle-sidebar";
import { useBattleStore } from "@/lib/battle-store";
import { getNextPerformer, isRoundComplete } from "@/lib/battle-engine";
import {
  Play,
  ArrowRight,
  XCircle,
  RotateCcw,
  AlertTriangle,
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
  } = useBattleStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Navigation guard - prevent leaving page during ongoing battle
  const { NavigationDialog } = useNavigationGuard({
    when: battle?.status === "ongoing",
    title: "Cancel Match?",
    message:
      "Are you sure you want to leave? The match will be marked as incomplete in the archive and cannot be resumed later.",
    onConfirm: async () => {
      if (battle) {
        await cancelBattle();
      }
    },
  });

  useEffect(() => {
    setBattle(initialBattle);
  }, [initialBattle, setBattle]);

  // Voting timer effect - starts when round is complete
  useEffect(() => {
    if (!battle) return;

    const roundComplete = isRoundComplete(battle, battle.currentRound);
    const nextPerformer = getNextPerformer(battle);

    // Start voting phase when round is complete and we're not already in voting phase
    if (
      roundComplete &&
      !nextPerformer &&
      battle.status === "ongoing" &&
      !isVotingPhase &&
      votingCompletedRound !== battle.currentRound
    ) {
      setIsVotingPhase(true);
      setVotingTimeRemaining(10); // 10 seconds for voting
    }
  }, [
    battle,
    isVotingPhase,
    setIsVotingPhase,
    setVotingTimeRemaining,
    votingCompletedRound,
  ]);

  // Countdown timer effect
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

  if (!battle) {
    return (
      <div className="min-h-screen bg-linear-to-b from-stage-darker to-stage-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold flex items-end justify-center gap-4">
            <span className="bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text animate-pulse">
              Loading Battle
            </span>
            <div className="flex items-end space-x-2 pb-2">
              <div
                className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
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

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullVerse += chunk;
          setStreamingVerse(fullVerse, personaId);
        }
      }

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

  const handleVote = async (round: number, personaId: string) => {
    try {
      const response = await fetch(`/api/battle/${battle.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round,
          personaId,
          userId: `user-${Date.now()}`, // Simple user ID for now
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Vote failed:", errorData.error);
        // Silently fail - the UI will prevent invalid votes anyway
        return;
      }

      const { battle: updatedBattle } = await response.json();
      setBattle(updatedBattle);
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleComment = async (username: string, content: string) => {
    try {
      const response = await fetch(`/api/battle/${battle.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
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
    // Reset voting phase when advancing
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
    setCancelError(null);
    try {
      await cancelBattle();
      // Redirect to archive after canceling
      window.location.href = "/archive";
    } catch (error) {
      console.error("Error canceling battle:", error);
      setCancelError("Failed to cancel battle. Please try again.");
      setIsCanceling(false);
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
    !isVotingPhase;

  // If battle is completed or incomplete, use full replay mode
  if (battle.status === "completed" || battle.status === "incomplete") {
    return (
      <div className="flex flex-col md:h-[calc(100vh-3.5rem)] md:flex-row">
        {/* Main Stage */}
        <div className="flex-1 flex flex-col min-h-0">
          <BattleReplay battle={battle} />

          {/* Resume Button for Incomplete Battles */}
          {battle.status === "incomplete" && (
            <div className="p-4 bg-gray-900 border-t border-gray-800">
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
                      Resume Match
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-96">
          <BattleSidebar
            battle={battle}
            onVote={handleVote}
            onComment={handleComment}
            isArchived={true}
            votingCompletedRound={votingCompletedRound}
          />
        </div>
      </div>
    );
  }

  // Live battle mode
  return (
    <>
      <div className="flex flex-col md:h-[calc(100vh-3.5rem)] md:flex-row">
        {/* Main Stage */}
        <div className="flex-1 flex flex-col min-h-0">
          <BattleStage
            battle={battle}
            streamingPersonaId={streamingPersonaId}
            streamingText={streamingVerse}
          />

          {/* Control Bar */}
          {canGenerate && (
            <div className="p-4 bg-gray-900 border-t border-gray-800">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGenerateVerse}
                  disabled={isGenerating}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Next: {battle.personas[nextPerformer].name}
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelBattle}
                  disabled={isCanceling || isGenerating}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel Match
                </button>
              </div>
            </div>
          )}

          {/* Voting Timer Display */}
          {isVotingPhase && votingTimeRemaining !== null && (
            <div className="p-4 bg-gray-900 border-t border-gray-800">
              <div className="max-w-4xl mx-auto">
                <div className="bg-linear-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-center">
                  <div className="text-white text-lg font-medium mb-2">
                    ⏱️ Vote Now!
                  </div>
                  <div className="text-5xl font-bold text-white mb-2 font-bebas-neue">
                    {votingTimeRemaining}
                  </div>
                  <div className="text-white/80 text-sm">
                    seconds remaining to cast your vote
                  </div>
                  <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(votingTimeRemaining / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advance Round Button */}
          {canAdvance && (
            <div className="p-4 bg-gray-900 border-t border-gray-800">
              <div className="max-w-4xl mx-auto space-y-3">
                {/* Voting Ended Message */}
                <div className="bg-gray-800 rounded-lg p-4 text-center border-2 border-green-500/30">
                  <div className="text-green-400 font-medium text-lg mb-1">
                    ✓ Voting has ended
                  </div>
                  <div className="text-gray-400 text-sm">
                    Round {battle.currentRound} is complete
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAdvanceRound}
                    className="flex-1 px-6 py-3 bg-linear-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all animate-pulse"
                  >
                    <ArrowRight className="w-5 h-5" />
                    {battle.currentRound === 3
                      ? "Reveal Winner"
                      : "Continue to Next Round"}
                  </button>
                  <button
                    onClick={handleCancelBattle}
                    disabled={isCanceling}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel Match
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-96">
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

      {/* Cancel Match Dialog */}
      <Dialog.Root open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-xl font-bold text-white mb-2">
                  Cancel Match?
                </Dialog.Title>
                <Dialog.Description className="text-gray-400 mb-4">
                  Are you sure you want to cancel this match? It will be marked
                  as incomplete in the archive and cannot be resumed later.
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
                      Keep Match
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={confirmCancelBattle}
                    disabled={isCanceling}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
                  >
                    {isCanceling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      "Cancel Match"
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
