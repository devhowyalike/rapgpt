"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Globe,
  Lock,
  MessageSquare,
  MoreVertical,
  Music2,
  Play,
  Radio,
  Share2,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BattleStatusButton } from "@/components/battle-status-button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { getWinnerPosition } from "@/lib/battle-engine";
import { calculateTotalScores } from "@/lib/battle-position-utils";
import { DEFAULT_STAGE, getStage } from "@/lib/shared/stages";
import { cn } from "@/lib/utils";
import { getDisplayRound } from "@/lib/shared";

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
  const [showCopiedDialog, setShowCopiedDialog] = useState(false);

  const personas = {
    player1: battle.player1Persona as any,
    player2: battle.player2Persona as any,
  };

  const battleUrl = `${shareUrl}/battle/${battle.id}`;
  const stage = getStage(battle.stageId || "") || DEFAULT_STAGE;

  useEffect(() => {
    setIsPublic(battle.isPublic || false);
  }, [battle.isPublic]);

  const handleShare = () => {
    navigator.clipboard.writeText(battleUrl);
    setShowCopiedDialog(true);
  };

  const handleTogglePublic = async () => {
    setIsTogglingPublic(true);
    try {
      const response = await fetch(`/api/battle/${battle.id}/toggle-public`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (data.success) {
        setIsPublic(data.isPublic);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Failed to toggle battle public status:", error);
      alert("Failed to update battle status");
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

  // Stats & Helpers
  const isPaused = battle.status === "paused";
  const isCompleted = battle.status === "completed";
  const isArchived = !!battle.liveStartedAt && !battle.isLive;
  const isLive = battle.isLive;
  const currentRound = battle.currentRound || 1;
  const versesCount = battle.verses?.length || 0;
  const cannotPublish =
    !isPublic && (isPaused || !userIsProfilePublic || isArchived);

  const calculateFinalStats = () => {
    if (!isCompleted || !battle.scores) return null;
    const totalScores = calculateTotalScores(battle.scores);
    return {
      player1TotalScore: totalScores.player1,
      player2TotalScore: totalScores.player2,
      winner: battle.winner,
    };
  };

  const finalStats = calculateFinalStats();

  // Determine winner position directly from scores to handle same-name/same-persona battles correctly
  const winnerPosition =
    isCompleted && battle.scores ? getWinnerPosition(battle as any) : null;

  const getWinnerName = () => {
    if (!finalStats?.winner || finalStats.winner === "tie") return "Tie";
    if (finalStats.winner === personas.player1.id) return personas.player1.name;
    if (finalStats.winner === personas.player2.id) return personas.player2.name;
    return finalStats.winner;
  };

  const winnerId = finalStats?.winner;

  const statusColor = isLive
    ? "red"
    : isCompleted
    ? "green"
    : isPaused
    ? "orange"
    : "gray";

  // Determine border/bg styles based on status for the "strip" effect
  const stripColor =
    statusColor === "red"
      ? "bg-red-500"
      : statusColor === "green"
      ? "bg-green-500"
      : statusColor === "orange"
      ? "bg-orange-500"
      : "bg-gray-500";

  return (
    <div
      className={cn(
        "group relative flex flex-col md:flex-row md:items-center bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-lg overflow-hidden transition-all duration-200 hover:bg-zinc-900/80 hover:border-white/10",
        (isDeleting || isPending) && "opacity-50 pointer-events-none"
      )}
    >
      {/* Status Strip (Left Edge) */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 md:w-1.5",
          stripColor
        )}
      />

      {/* Main Content Container */}
      <div className="flex flex-1 flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 px-4 md:p-4 md:pl-6 relative">
        {/* Top Right Management Menu (Absolute Positioned) */}
        {showManagement && !isPaused && (
          <div className="absolute top-2 right-2 md:top-auto md:bottom-auto md:right-4 z-20">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors outline-none"
                  onClick={(e) => e.stopPropagation()} // Prevent card click
                >
                  <MoreVertical size={16} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[160px] bg-gray-900 border border-gray-800 rounded-lg p-1 shadow-xl z-50 text-gray-200"
                  sideOffset={5}
                  align="end"
                >
                  <DropdownMenu.Item asChild>
                    <Link
                      href={`/battle/${battle.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-800 rounded cursor-pointer outline-none"
                    >
                      {isPaused || isLive ? (
                        <Play size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                      {isPaused
                        ? "Resume Battle"
                        : isLive
                        ? "Join Battle"
                        : isCompleted
                        ? "Replay Battle"
                        : "View Battle"}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-800 rounded cursor-pointer outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                  >
                    <Share2 size={14} />
                    Share
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none",
                      cannotPublish
                        ? "text-gray-500 cursor-not-allowed"
                        : "hover:bg-gray-800"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!cannotPublish) handleTogglePublic();
                    }}
                    disabled={isTogglingPublic || cannotPublish}
                  >
                    {isPublic ? (
                      <>
                        <Lock size={14} />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Globe size={14} />
                        Publish
                      </>
                    )}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-gray-800 my-1" />
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded cursor-pointer outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}

        {/* Left: Matchup & Meta */}
        <Link
          href={`/battle/${battle.id}`}
          className="flex-1 min-w-0 group-hover:opacity-100 pr-8 md:pr-0" // Add padding right to avoid overlap with menu on mobile
        >
          <div className="flex flex-col gap-1">
            {/* Matchup Title */}
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-baseline gap-x-2 text-lg md:text-xl font-bebas tracking-wide leading-none md:leading-none">
              <div className="flex items-center gap-2 truncate">
                <span className="text-blue-400">{personas.player1.name}</span>
                {isCompleted && winnerPosition === "player1" && (
                  <span title="Winner">🏆</span>
                )}
                <span className="text-gray-600 text-sm font-sans italic font-bold">
                  vs
                </span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <span className="text-red-400">{personas.player2.name}</span>
                {isCompleted && winnerPosition === "player2" && (
                  <span title="Winner">🏆</span>
                )}
              </div>
            </div>

            {/* Subtext: Stage • Date */}
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs text-gray-500 uppercase tracking-wider mt-1">
              <div className="flex items-center gap-2 truncate max-w-full">
                <span className="truncate">
                  {stage.flag} {stage.name}
                </span>
                <span className="hidden md:inline">•</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">
                  {battle.createdAt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {/* Feature Icons - Inline */}
                {(battle.generatedSong?.audioUrl ||
                  battle.votingEnabled ||
                  battle.commentsEnabled) && (
                  <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
                    {battle.generatedSong?.audioUrl && (
                      <Music2 size={10} className="text-green-400" />
                    )}
                    {battle.votingEnabled && (
                      <ThumbsUp size={10} className="text-blue-400" />
                    )}
                    {battle.commentsEnabled && (
                      <MessageSquare size={10} className="text-purple-400" />
                    )}
                  </div>
                )}

                {/* Round Info for Paused Battles */}
                {isPaused && (
                  <div className="flex items-center gap-2 ml-2 border-l border-white/10 pl-2">
                    <span>Round {getDisplayRound(currentRound)}</span>
                  </div>
                )}

                {isCompleted && (
                  <div className="flex items-center gap-2 ml-2 border-l border-white/10 pl-2 text-xs font-semibold text-gray-400">
                    <span>
                      {finalStats?.player1TotalScore}-
                      {finalStats?.player2TotalScore}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Middle/Right: Status & Outcome & Actions */}
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3 md:gap-4 md:ml-auto">
          <Link
            href={`/battle/${battle.id}`}
            className="flex flex-row md:flex-col md:items-end gap-3 md:gap-1 min-w-[140px] md:text-right"
          >
            {isLive ? (
              <>
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 animate-pulse uppercase tracking-wide">
                  <Radio size={12} className="fill-current" />
                  Live Now
                </span>
                <span className="text-sm text-gray-300">
                  Round {getDisplayRound(currentRound)}
                </span>
              </>
            ) : null}
          </Link>

          {/* Action Button - Only show if actionable (Live/Paused) */}
          {(isLive || isPaused) && (
            <div
              className={cn(
                "flex items-center gap-2 mt-2 md:mt-0",
                isPaused &&
                  "absolute top-3 right-3 md:static md:top-auto md:right-auto"
              )}
            >
              <Link
                href={`/battle/${battle.id}`}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                  isLive
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                )}
              >
                {isLive ? "Join" : "Resume"}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Remove the old footer container entirely */}

      {/* Dialogs */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Battle?"
        description="Are you sure you want to delete this beef? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="danger"
        icon={AlertTriangle}
      />

      <ConfirmationDialog
        open={showCopiedDialog}
        onOpenChange={setShowCopiedDialog}
        title="Link Copied"
        description="The battle link has been copied to your clipboard and is ready to paste."
        confirmLabel="OK"
        onConfirm={() => setShowCopiedDialog(false)}
        variant="success"
        icon={CheckCircle}
      />
    </div>
  );
}
