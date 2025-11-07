"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  Trash2,
  AlertTriangle,
  Radio,
  CheckCircle,
  Lock,
  Globe,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { getStage, DEFAULT_STAGE } from "@/lib/shared/stages";
import { BattleInfoPanel } from "@/components/battle-info-panel";
import { BattleStatusButton } from "@/components/battle-status-button";

interface MyBattleCardProps {
  battle: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    leftPersona: any;
    rightPersona: any;
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
    left: battle.leftPersona as any,
    right: battle.rightPersona as any,
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
    let leftTotalScore = 0;
    let rightTotalScore = 0;

    const leftPersonaId = personas.left.id;
    const rightPersonaId = personas.right.id;

    for (const roundScore of battle.scores) {
      if (roundScore.personaScores) {
        leftTotalScore +=
          roundScore.personaScores[leftPersonaId]?.totalScore || 0;
        rightTotalScore +=
          roundScore.personaScores[rightPersonaId]?.totalScore || 0;
      }
    }

    return {
      totalRounds,
      leftTotalScore: Math.round(leftTotalScore),
      rightTotalScore: Math.round(rightTotalScore),
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

    const winnerName =
      finalStats.winner === personas.left.id
        ? personas.left.name
        : personas.right.name;

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
        leftPersonaId: personas.left.id,
        leftPersonaName: personas.left.name,
        rightPersonaId: personas.right.id,
        rightPersonaName: personas.right.name,
        leftTotalScore: finalStats.leftTotalScore,
        rightTotalScore: finalStats.rightTotalScore,
        totalRounds: finalStats.totalRounds,
      }
    : null;

  return (
    <div
      className={`h-full flex flex-col bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all ${
        isDeleting || isPending ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
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

      <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
        {battle.isLive && (
          <span className="px-3 py-1 rounded bg-red-600 text-white flex items-center gap-1.5 font-semibold animate-pulse">
            <Radio size={14} className="fill-white" />
            LIVE
          </span>
        )}
        {/* Removed secondary archived badge per request */}
        {showManagement && battle.status !== "completed" && (
          <>
            <span
              className={`px-3 py-1 rounded capitalize ${
                battle.status === "paused"
                  ? "bg-orange-600/30 text-orange-300"
                  : "bg-gray-600/30 text-gray-400"
              }`}
            >
              {battle.status}
            </span>
          </>
        )}
      </div>

      {isPaused && (
        <BattleInfoPanel
          type="progress"
          createdAt={battle.createdAt}
          stage={stage}
          featureBadges={featureBadgesProps}
          currentRound={currentRound}
          versesCount={versesCount}
        />
      )}

      {isCompleted && finalStats && (
        <BattleInfoPanel
          type="results"
          createdAt={battle.createdAt}
          stage={stage}
          featureBadges={featureBadgesProps}
          resultsStats={battleResultsProps}
        />
      )}

      {/* Error message for toggle failures */}
      {toggleError && (
        <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-500/30">
          <p className="text-sm text-red-300">{toggleError}</p>
        </div>
      )}

      {/* Flexible spacer to push buttons to bottom */}
      <div className="flex-1" />

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
