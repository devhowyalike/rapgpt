"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Crown,
  Globe,
  Lock,
  Radio,
  Music2,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

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

  const personas = {
    left: battle.leftPersona as any,
    right: battle.rightPersona as any,
  };

  const battleUrl = `${shareUrl}/battle/${battle.id}`;

  // Sync local state with prop when battle.isPublic changes (e.g., after profile privacy toggle)
  useEffect(() => {
    setIsPublic(battle.isPublic || false);
  }, [battle.isPublic]);

  const handleShare = () => {
    navigator.clipboard.writeText(battleUrl);
    alert("Link copied to clipboard!");
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
  const isPaused = battle.status === "incomplete";
  const isCompleted = battle.status === "completed";
  const isArchived = !!battle.liveStartedAt && !battle.isLive;
  const currentRound = battle.currentRound || 1;
  const versesCount = battle.verses?.length || 0;

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

  return (
    <div
      className={`h-full flex flex-col bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all ${
        isDeleting || isPending ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            href={`/battle/${battle.id}`}
            className="font-bebas text-3xl text-white hover:text-purple-400 transition-colors"
          >
            {battle.title}
          </Link>
        </div>
        {showManagement && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={`px-3 py-1.5 rounded flex items-center gap-1.5 text-xs transition-colors ${
                  isPublic
                    ? "bg-blue-600/30 text-blue-300 hover:bg-blue-600/40"
                    : isArchived
                    ? "bg-purple-600/30 text-purple-300 hover:bg-purple-600/40"
                    : "bg-gray-600/30 text-gray-300 hover:bg-gray-600/40"
                }`}
                title="Manage battle"
              >
                {isPublic ? (
                  <>
                    <Globe size={12} />
                    Public
                  </>
                ) : isArchived ? (
                  <>
                    <Radio size={12} />
                    Live Event
                  </>
                ) : (
                  <>
                    <Lock size={12} />
                    Unpublished
                  </>
                )}
                <MoreVertical size={12} className="ml-0.5" />
              </button>
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
                    !isPublic &&
                    (isPaused || !userIsProfilePublic || isArchived)
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-gray-200 hover:bg-gray-700"
                  }`}
                  onClick={
                    !isPublic &&
                    (isPaused || !userIsProfilePublic || isArchived)
                      ? undefined
                      : handleTogglePublic
                  }
                  disabled={
                    isTogglingPublic ||
                    (!isPublic &&
                      (isPaused || !userIsProfilePublic || isArchived))
                  }
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
        {showManagement && (
          <>
            <span
              className={`px-3 py-1 rounded ${
                battle.status === "completed"
                  ? "bg-green-600/30 text-green-300"
                  : battle.status === "ongoing"
                  ? "bg-yellow-600/30 text-yellow-300"
                  : battle.status === "incomplete"
                  ? "bg-orange-600/30 text-orange-300"
                  : "bg-gray-600/30 text-gray-400"
              }`}
            >
              {battle.status === "incomplete" ? "paused" : battle.status}
            </span>
          </>
        )}
        <span className="text-gray-500">
          Created {new Date(battle.createdAt).toLocaleDateString()}
        </span>
        {battle.votingEnabled !== false && (
          <span
            className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 flex items-center gap-1.5 text-xs border border-blue-500/30"
            title="Voting enabled"
          >
            <ThumbsUp size={12} />
            <span>Voting</span>
          </span>
        )}
        {battle.commentsEnabled !== false && (
          <span
            className="px-2 py-1 rounded bg-purple-600/20 text-purple-400 flex items-center gap-1.5 text-xs border border-purple-500/30"
            title="Comments enabled"
          >
            <MessageSquare size={12} />
            <span>Comments</span>
          </span>
        )}
        {battle.generatedSong?.audioUrl ? (
          <span
            className="ml-auto inline-flex items-center justify-center rounded-full bg-green-500/15 text-green-400 px-2 py-0.5 border border-green-500/30"
            title="Song generated"
          >
            <Music2 className="w-4 h-4" />
          </span>
        ) : null}
      </div>

      {isPaused && (
        <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-orange-500/20">
          <p className="text-sm font-semibold text-orange-400 mb-2">
            Battle Progress:
          </p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Round {currentRound} of 3</li>
            <li>
              • {versesCount} {versesCount === 1 ? "verse" : "verses"} completed
            </li>
          </ul>
        </div>
      )}

      {isCompleted && finalStats && (
        <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-green-500/20">
          <p className="text-sm font-semibold text-green-400 mb-2">
            Battle Results:
          </p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li className="flex items-center gap-1">
              • Winner:{" "}
              <span className="text-green-400 font-semibold flex items-center gap-1">
                {finalStats.winner === personas.left.id
                  ? personas.left.name
                  : finalStats.winner === personas.right.id
                  ? personas.right.name
                  : finalStats.winner
                  ? finalStats.winner
                  : "Tie"}
                {finalStats.winner && finalStats.winner !== "tie" ? (
                  <>
                    <Crown size={14} className="inline text-yellow-400" />
                  </>
                ) : null}
              </span>
            </li>
            <li>
              • Final Score: {finalStats.leftTotalScore} -{" "}
              {finalStats.rightTotalScore}
            </li>
            <li>• {finalStats.totalRounds} rounds completed</li>
          </ul>
        </div>
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
          ) : battle.status === "incomplete" ? (
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
    </div>
  );
}
