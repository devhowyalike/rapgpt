"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  AlertTriangle,
  CheckCircle,
  Globe,
  Lock,
  Radio,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BattleFeatureBadges } from "@/components/battle-feature-badges";
import { BattleInfoPanel } from "@/components/battle-info-panel";
import { BattleStatusButton } from "@/components/battle-status-button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { getWinnerPosition } from "@/lib/battle-engine";
import { calculateTotalScores } from "@/lib/battle-position-utils";
import type { Battle } from "@/lib/shared";
import { DEFAULT_STAGE, getStage } from "@/lib/shared/stages";

interface MyBattleCardProps {
  battle: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    player1Persona: any;
    player2Persona: any;
    currentRound?: number;
    verses?: any[];
    winner?: string | null;
    scores?: any[];
    isPublic?: boolean;
    isLive?: boolean;
    liveStartedAt?: Date | null;
    isFeatured?: boolean;
    votingEnabled?: boolean;
    commentsEnabled?: boolean;
    stageId?: string;
    generatedSong?: {
      audioUrl: string;
      videoUrl?: string;
      imageUrl?: string;
      title?: string;
      beatStyle?: string;
      generatedAt?: number;
      sunoTaskId?: string;
    } | null;
  };
  shareUrl: string;
  showManagement?: boolean;
  userIsProfilePublic?: boolean;
}

export function MyBattleCard({
  battle,
  shareUrl,
  showManagement = false,
  userIsProfilePublic = true,
}: MyBattleCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState(battle.isPublic || false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [showCopiedDialog, setShowCopiedDialog] = useState(false);

  const personas = {
    player1: battle.player1Persona as any,
    player2: battle.player2Persona as any,
  };

  const battleUrl = `${shareUrl}/battle/${battle.id}`;
  const stage = getStage(battle.stageId || "") || DEFAULT_STAGE;

  // Sync local state with prop when battle.isPublic changes (e.g., after profile privacy toggle)
  useEffect(() => {
    setIsPublic(battle.isPublic || false);
  }, [battle.isPublic]);

  const handleShare = () => {
    navigator.clipboard.writeText(battleUrl);
    setShowCopiedDialog(true);
  };

  const handleTogglePublic = async () => {
    setIsTogglingPublic(true);
    setToggleError(null);
    try {
      const response = await fetch(`/api/battle/${battle.id}/toggle-public`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (data.success) {
        setIsPublic(data.isPublic);
      } else if (data.error) {
        setToggleError(data.error);
      }
    } catch (error) {
      console.error("Failed to toggle battle public status:", error);
      setToggleError("Failed to update battle status");
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/battle/${battle.id}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        // Use startTransition for smooth UI updates without flashing
        startTransition(() => {
          router.refresh();
        });
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete battle");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Failed to delete battle:", error);
      alert("Failed to delete battle");
      setIsDeleting(false);
    }
  };

  // Calculate battle progress stats for paused battles
  const isPaused = battle.status === "paused";
  const isCompleted = battle.status === "completed";
  const isArchived = !!battle.liveStartedAt && !battle.isLive;
  const currentRound = battle.currentRound || 1;
  const versesCount = battle.verses?.length || 0;

  // Check if battle can be published
  const cannotPublish =
    !isPublic && (isPaused || !userIsProfilePublic || isArchived);

  // Calculate final stats for completed battles
  const calculateFinalStats = () => {
    if (!isCompleted || !battle.scores) return null;

    const totalRounds = battle.scores.length;
    const totalScores = calculateTotalScores(battle.scores);

    return {
      totalRounds,
      player1TotalScore: totalScores.player1,
      player2TotalScore: totalScores.player2,
      winner: battle.winner,
    };
  };

  const finalStats = calculateFinalStats();

  // Format title with crown next to winner's name
  const formatTitleWithCrown = () => {
    // Replace "vs" with "vs." for consistency
    let formattedTitle = battle.title.replace(/ vs /g, " vs. ");

    if (
      !isCompleted ||
      !finalStats ||
      !finalStats.winner ||
      finalStats.winner === "tie"
    ) {
      return formattedTitle;
    }

    // Create a Battle-like object with proper structure for getWinnerPosition
    const battleForWinner = {
      ...battle,
      personas,
      scores: battle.scores || [],
    } as unknown as Battle;

    const winnerPosition = getWinnerPosition(battleForWinner);
    const winnerName =
      winnerPosition === "player1"
        ? personas.player1.name
        : personas.player2.name;

    // Replace the winner's name with their name + crown
    return formattedTitle.replace(winnerName, `${winnerName} 👑`);
  };

  // Prepare props for reusable components
  const featureBadgesProps = {
    votingEnabled: battle.votingEnabled,
    commentsEnabled: battle.commentsEnabled,
    hasGeneratedSong: !!battle.generatedSong?.audioUrl,
  };

  const battleResultsProps = finalStats
    ? {
        winner: finalStats.winner,
        player1PersonaId: personas.player1.id,
        player1PersonaName: personas.player1.name,
        player2PersonaId: personas.player2.id,
        player2PersonaName: personas.player2.name,
        player1TotalScore: finalStats.player1TotalScore,
        player2TotalScore: finalStats.player2TotalScore,
        totalRounds: finalStats.totalRounds,
      }
    : null;

  return (
    <div
      className={`flex flex-col md:min-h-[320px] bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all ${
        isDeleting || isPending ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="flex-1">
          <Link
            href={`/battle/${battle.id}`}
            className="font-bebas text-2xl text-white hover:text-purple-400 transition-colors block text-pretty"
          >
            {formatTitleWithCrown()}
          </Link>
        </div>
        {showManagement && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <BattleStatusButton isPublic={isPublic} isArchived={isArchived} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[180px] bg-gray-800 border border-gray-700 rounded-lg p-1 shadow-xl z-50"
                sideOffset={5}
                align="end"
              >
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded cursor-pointer outline-none"
                  onClick={handleShare}
                >
                  <Share2 size={16} />
                  Share Link
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none ${
                    cannotPublish
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-gray-200 hover:bg-gray-700"
                  }`}
                  onClick={cannotPublish ? undefined : handleTogglePublic}
                  disabled={isTogglingPublic || cannotPublish}
                >
                  {isPublic ? (
                    <>
                      <Lock size={16} />
                      Unpublish Battle
                    </>
                  ) : (
                    <>
                      <Globe size={16} />
                      {isArchived
                        ? "Cannot Publish (Archived)"
                        : isPaused
                          ? "Cannot Publish (Paused)"
                          : !userIsProfilePublic
                            ? "Cannot Publish (Private Profile)"
                            : "Publish Battle"}
                    </>
                  )}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded cursor-pointer outline-none"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 size={16} />
                  Delete Battle
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>

      {/* Created date below title */}
      <div className="text-xs text-gray-500 mb-2">
        Created {battle.createdAt.toLocaleDateString()}
      </div>

      {/* Paused badge and Feature badges on same row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {battle.isLive && (
          <span className="px-3 py-1 rounded bg-red-600 text-white flex items-center gap-1.5 font-semibold animate-pulse">
            <Radio size={14} className="fill-white" />
            LIVE
          </span>
        )}
        {showManagement && battle.status !== "completed" && (
          <span
            className={`px-3 py-1 rounded capitalize text-sm ${
              battle.status === "paused"
                ? "bg-orange-600/30 text-orange-300"
                : "bg-gray-600/30 text-gray-400"
            }`}
          >
            {battle.status}
          </span>
        )}
        <BattleFeatureBadges {...featureBadgesProps} />
      </div>

      {/* Spacer to push Battle Results to consistent position on desktop only */}
      <div className="hidden md:flex md:flex-1 md:min-h-0" />

      {isPaused && (
        <BattleInfoPanel
          type="progress"
          createdAt={battle.createdAt}
          stage={stage}
          currentRound={currentRound}
          versesCount={versesCount}
        />
      )}

      {isCompleted && finalStats && (
        <BattleInfoPanel
          type="results"
          createdAt={battle.createdAt}
          stage={stage}
          resultsStats={battleResultsProps}
        />
      )}

      {/* Error message for toggle failures */}
      {toggleError && (
        <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-500/30">
          <p className="text-sm text-red-300">{toggleError}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link
          href={`/battle/${battle.id}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white ${
            battle.isLive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {battle.isLive ? (
            <>
              <Radio size={16} className="fill-white" />
              Join Live
            </>
          ) : battle.status === "paused" ? (
            "Resume Beef"
          ) : battle.status === "completed" ? (
            "Replay Battle"
          ) : (
            "View Battle"
          )}
        </Link>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Battle?"
        description="Are you sure you want to delete this beef? This will also delete all votes and comments. This action cannot be undone."
        confirmLabel="Delete Battle"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="danger"
        icon={AlertTriangle}
      />

      {/* Link Copied Success Dialog */}
      <ConfirmationDialog
        open={showCopiedDialog}
        onOpenChange={setShowCopiedDialog}
        title="Link Copied!"
        description="The battle link has been copied to your clipboard."
        confirmLabel="OK"
        onConfirm={() => setShowCopiedDialog(false)}
        variant="success"
        icon={CheckCircle}
      />
    </div>
  );
}
