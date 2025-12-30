"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  AlertTriangle,
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
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useBattleShare } from "@/hooks/use-battle-share";
import { getWinnerPosition } from "@/lib/battle-engine";
import { calculateTotalScores } from "@/lib/battle-position-utils";
import { DEFAULT_STAGE, getStage } from "@/lib/shared/stages";
import { cn } from "@/lib/utils";
import { getDisplayRound } from "@/lib/shared";

type CardVariant =
  | "original"
  | "minimal"
  | "scoreboard"
  | "esports"
  | "horizontal";

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
  variant?: CardVariant;
}

export function MyBattleCard({
  battle,
  shareUrl,
  showManagement = false,
  userIsProfilePublic = true,
  variant = "original",
}: MyBattleCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState(battle.isPublic || false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { shareBattle, ShareDialog } = useBattleShare();

  const personas = {
    player1: battle.player1Persona as any,
    player2: battle.player2Persona as any,
  };

  const battleUrl = `${shareUrl}/battle/${battle.id}`;
  const stage = getStage(battle.stageId || "") || DEFAULT_STAGE;

  useEffect(() => {
    setIsPublic(battle.isPublic || false);
  }, [battle.isPublic]);

  const handleShare = async () => {
    await shareBattle(battleUrl);
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
        startTransition(() => {
          router.refresh();
        });
        return true;
      } else if (data.error) {
        alert(data.error);
        return false;
      }
    } catch (error) {
      console.error("Failed to toggle battle public status:", error);
      alert("Failed to update battle status");
      return false;
    } finally {
      setIsTogglingPublic(false);
    }
    return false;
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
  const cannotPublish = !isPublic && (isPaused || !userIsProfilePublic);

  const hasMenu = showManagement;
  const hasAction = isLive || isPaused || isCompleted || isPublic;

  const handleCardClick = () => {
    // Always navigate to the battle when clicking the card
    router.push(`/battle/${battle.id}`);
  };

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

  // Shared menu component for all variants
  const MenuDropdown = () => (
    <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors outline-none"
          onClick={(e) => e.stopPropagation()}
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
              {isLive ? (
                <Radio size={14} />
              ) : isPaused ? (
                <Play size={14} />
              ) : (
                <Eye size={14} />
              )}
              {isPaused
                ? "Resume Battle"
                : isLive
                ? "Join Live Battle"
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
              if (!cannotPublish) {
                if (!isPublic) setShowPublishDialog(true);
                else setShowUnpublishDialog(true);
              }
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
  );

  // Shared dialogs for all variants
  const Dialogs = () => (
    <>
      <ConfirmationDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        title="Publish Battle?"
        description="Publishing this battle will make it visible on your public profile and the community page. Anyone will be able to view and share it."
        confirmLabel="Publish"
        onConfirm={async () => {
          const success = await handleTogglePublic();
          if (success) setShowPublishDialog(false);
        }}
        isLoading={isTogglingPublic}
        variant="info"
        icon={Globe}
      />
      <ConfirmationDialog
        open={showUnpublishDialog}
        onOpenChange={setShowUnpublishDialog}
        title="Unpublish Battle?"
        description="Unpublishing this battle will make it private. It will only be visible to you."
        confirmLabel="Unpublish"
        onConfirm={async () => {
          const success = await handleTogglePublic();
          if (success) setShowUnpublishDialog(false);
        }}
        isLoading={isTogglingPublic}
        variant="info"
        icon={Lock}
      />
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
      <ShareDialog />
    </>
  );

  // ============================================
  // VARIANT: MINIMAL/CLEAN
  // ============================================
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "group relative bg-white/2 border border-white/6 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/4 hover:border-white/12",
          (isDeleting || isPending) && "opacity-50 pointer-events-none",
          (hasMenu || hasAction) && "cursor-pointer"
        )}
        onClick={handleCardClick}
      >
        {/* Variant Label */}
        <div className="absolute top-2 left-3 z-10">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded">
            Minimal
          </span>
        </div>

        <div className="p-5 pt-8">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide",
                isLive && "bg-red-500/10 text-red-400",
                isCompleted && "bg-emerald-500/10 text-emerald-400",
                isPaused && "bg-amber-500/10 text-amber-400",
                !isLive &&
                  !isCompleted &&
                  !isPaused &&
                  "bg-white/5 text-white/40"
              )}
            >
              {isLive && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Live
                </>
              )}
              {isCompleted && "Completed"}
              {isPaused && "Paused"}
              {!isLive && !isCompleted && !isPaused && "Draft"}
            </div>
            {hasMenu && <MenuDropdown />}
          </div>

          {/* Players */}
          <div className="flex items-center justify-center gap-6 mb-5">
            {/* Player 1 */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "relative w-14 h-14 rounded-full overflow-hidden ring-2 transition-all",
                  winnerPosition === "player1"
                    ? "ring-yellow-400"
                    : "ring-white/10"
                )}
              >
                <Image
                  src={personas.player1.avatar}
                  alt={personas.player1.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-sm font-medium text-white/80 max-w-[80px] truncate">
                {personas.player1.name}
              </span>
              {isCompleted && (
                <span className="text-lg font-bold text-white/60">
                  {finalStats?.player1TotalScore}
                </span>
              )}
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-white/20 uppercase tracking-widest">
                vs
              </span>
              {winnerPosition && <span className="text-lg">🏆</span>}
            </div>

            {/* Player 2 */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "relative w-14 h-14 rounded-full overflow-hidden ring-2 transition-all",
                  winnerPosition === "player2"
                    ? "ring-yellow-400"
                    : "ring-white/10"
                )}
              >
                <Image
                  src={personas.player2.avatar}
                  alt={personas.player2.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-sm font-medium text-white/80 max-w-[80px] truncate">
                {personas.player2.name}
              </span>
              {isCompleted && (
                <span className="text-lg font-bold text-white/60">
                  {finalStats?.player2TotalScore}
                </span>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-center gap-3 text-xs text-white/30">
            <span>
              {stage.flag} {stage.name}
            </span>
            <span>·</span>
            <span>
              {battle.createdAt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
            {isPaused && (
              <>
                <span>·</span>
                <span>Round {getDisplayRound(currentRound)}</span>
              </>
            )}
          </div>

          {/* Action */}
          {(isLive || isPaused) && (
            <div className="flex justify-center mt-4">
              <Link
                href={`/battle/${battle.id}`}
                className={cn(
                  "px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all",
                  isLive
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white/10 hover:bg-white/15 text-white"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {isLive ? "Join Live" : "Resume"}
              </Link>
            </div>
          )}
        </div>
        <Dialogs />
      </div>
    );
  }

  // ============================================
  // VARIANT: SPORTS SCOREBOARD
  // ============================================
  if (variant === "scoreboard") {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg transition-all duration-200",
          (isDeleting || isPending) && "opacity-50 pointer-events-none",
          (hasMenu || hasAction) && "cursor-pointer"
        )}
        onClick={handleCardClick}
      >
        {/* Variant Label */}
        <div className="absolute top-2 left-3 z-10">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 bg-black/30 px-2 py-0.5 rounded">
            Scoreboard
          </span>
        </div>

        {/* Top Bar - Status */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wider",
            isLive && "bg-red-600 text-white",
            isCompleted && "bg-emerald-600 text-white",
            isPaused && "bg-amber-600 text-black",
            !isLive && !isCompleted && !isPaused && "bg-zinc-700 text-white/70"
          )}
        >
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
            {isLive
              ? "Live"
              : isCompleted
              ? "Final"
              : isPaused
              ? "Paused"
              : "Upcoming"}
          </div>
          <span className="font-mono">
            {stage.flag} {stage.name}
          </span>
          {hasMenu && <MenuDropdown />}
        </div>

        {/* Main Scoreboard */}
        <div className="bg-zinc-900 border-x border-b border-zinc-700">
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
            {/* Player 1 Side */}
            <div
              className={cn(
                "flex items-center gap-3 p-4 border-r border-zinc-700",
                winnerPosition === "player1" && "bg-yellow-500/5"
              )}
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500 shrink-0">
                <Image
                  src={personas.player1.avatar}
                  alt={personas.player1.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate">
                    {personas.player1.name}
                  </span>
                  {winnerPosition === "player1" && <span>🏆</span>}
                </div>
                <span className="text-xs text-blue-400 uppercase tracking-wide">
                  Blue Corner
                </span>
              </div>
            </div>

            {/* Score Center */}
            <div className="flex flex-col items-center justify-center px-6 py-4 bg-zinc-800">
              {isCompleted ? (
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-3xl font-bold font-mono",
                      winnerPosition === "player1"
                        ? "text-yellow-400"
                        : "text-white"
                    )}
                  >
                    {finalStats?.player1TotalScore}
                  </span>
                  <span className="text-zinc-500">-</span>
                  <span
                    className={cn(
                      "text-3xl font-bold font-mono",
                      winnerPosition === "player2"
                        ? "text-yellow-400"
                        : "text-white"
                    )}
                  >
                    {finalStats?.player2TotalScore}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-bold text-white/40">VS</span>
              )}
              {(isLive || isPaused) && (
                <span className="text-xs text-white/50 mt-1">
                  Round {getDisplayRound(currentRound)}
                </span>
              )}
            </div>

            {/* Player 2 Side */}
            <div
              className={cn(
                "flex items-center justify-end gap-3 p-4 border-l border-zinc-700",
                winnerPosition === "player2" && "bg-yellow-500/5"
              )}
            >
              <div className="min-w-0 text-right">
                <div className="flex items-center justify-end gap-2">
                  {winnerPosition === "player2" && <span>🏆</span>}
                  <span className="font-bold text-white truncate">
                    {personas.player2.name}
                  </span>
                </div>
                <span className="text-xs text-red-400 uppercase tracking-wide">
                  Red Corner
                </span>
              </div>
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-500 shrink-0">
                <Image
                  src={personas.player2.avatar}
                  alt={personas.player2.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 text-xs text-zinc-400 border-t border-zinc-700">
            <span>
              {battle.createdAt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <div className="flex items-center gap-2">
              {battle.generatedSong?.audioUrl && (
                <Music2 size={12} className="text-green-400" />
              )}
              {battle.votingEnabled && (
                <ThumbsUp size={12} className="text-blue-400" />
              )}
              {battle.commentsEnabled && (
                <MessageSquare size={12} className="text-purple-400" />
              )}
            </div>
            {(isLive || isPaused) && (
              <Link
                href={`/battle/${battle.id}`}
                className={cn(
                  "px-3 py-1 rounded text-xs font-bold uppercase",
                  isLive ? "bg-red-600 text-white" : "bg-purple-600 text-white"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {isLive ? "Watch" : "Resume"}
              </Link>
            )}
          </div>
        </div>
        <Dialogs />
      </div>
    );
  }

  // ============================================
  // VARIANT: GAMING/ESPORTS
  // ============================================
  if (variant === "esports") {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg transition-all duration-300",
          (isDeleting || isPending) && "opacity-50 pointer-events-none",
          (hasMenu || hasAction) && "cursor-pointer"
        )}
        onClick={handleCardClick}
      >
        {/* Variant Label */}
        <div className="absolute top-2 left-3 z-10">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/50 bg-black/50 px-2 py-0.5 rounded border border-cyan-500/20">
            Esports
          </span>
        </div>

        {/* Background with gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-900 to-zinc-800" />
        <div
          className={cn(
            "absolute inset-0 opacity-20",
            isLive &&
              "bg-linear-to-r from-red-600/30 via-transparent to-orange-600/30",
            isCompleted &&
              "bg-linear-to-r from-cyan-600/30 via-transparent to-purple-600/30",
            isPaused &&
              "bg-linear-to-r from-amber-600/30 via-transparent to-yellow-600/30"
          )}
        />

        {/* Neon border effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-lg border transition-all",
            isLive &&
              "border-red-500/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]",
            isCompleted &&
              "border-cyan-500/30 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]",
            isPaused &&
              "border-amber-500/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]",
            !isLive && !isCompleted && !isPaused && "border-white/10"
          )}
        />

        <div className="relative p-5 pt-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div
              className={cn(
                "flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
                isLive && "text-red-400",
                isCompleted && "text-cyan-400",
                isPaused && "text-amber-400",
                !isLive && !isCompleted && !isPaused && "text-white/40"
              )}
            >
              {isLive && (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  Live Match
                </span>
              )}
              {isCompleted && "Match Complete"}
              {isPaused && "Paused"}
              {!isLive && !isCompleted && !isPaused && "Pending"}
            </div>
            {hasMenu && <MenuDropdown />}
          </div>

          {/* Players */}
          <div className="flex items-center gap-4">
            {/* Player 1 */}
            <div className="flex-1 flex items-center gap-3">
              <div
                className={cn(
                  "relative w-16 h-16 rounded-lg overflow-hidden",
                  winnerPosition === "player1"
                    ? "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                    : "ring-1 ring-cyan-500/30"
                )}
              >
                <Image
                  src={personas.player1.avatar}
                  alt={personas.player1.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate text-lg">
                    {personas.player1.name}
                  </span>
                  {winnerPosition === "player1" && (
                    <span className="text-yellow-400">👑</span>
                  )}
                </div>
                {isCompleted && (
                  <span
                    className={cn(
                      "text-2xl font-bold font-mono",
                      winnerPosition === "player1"
                        ? "text-yellow-400"
                        : "text-white/50"
                    )}
                  >
                    {finalStats?.player1TotalScore}
                  </span>
                )}
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center px-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm",
                  "bg-linear-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30",
                  "text-purple-300"
                )}
              >
                VS
              </div>
              {(isLive || isPaused) && (
                <span className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                  R{getDisplayRound(currentRound)}
                </span>
              )}
            </div>

            {/* Player 2 */}
            <div className="flex-1 flex items-center justify-end gap-3">
              <div className="min-w-0 text-right">
                <div className="flex items-center justify-end gap-2">
                  {winnerPosition === "player2" && (
                    <span className="text-yellow-400">👑</span>
                  )}
                  <span className="font-bold text-white truncate text-lg">
                    {personas.player2.name}
                  </span>
                </div>
                {isCompleted && (
                  <span
                    className={cn(
                      "text-2xl font-bold font-mono",
                      winnerPosition === "player2"
                        ? "text-yellow-400"
                        : "text-white/50"
                    )}
                  >
                    {finalStats?.player2TotalScore}
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "relative w-16 h-16 rounded-lg overflow-hidden",
                  winnerPosition === "player2"
                    ? "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                    : "ring-1 ring-pink-500/30"
                )}
              >
                <Image
                  src={personas.player2.avatar}
                  alt={personas.player2.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-3 text-xs text-white/30">
              <span>
                {stage.flag} {stage.name}
              </span>
              <span>•</span>
              <span>
                {battle.createdAt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {(isLive || isPaused) && (
              <Link
                href={`/battle/${battle.id}`}
                className={cn(
                  "px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all",
                  isLive
                    ? "bg-linear-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-900/30"
                    : "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {isLive ? "Enter Arena" : "Continue"}
              </Link>
            )}

            <div className="flex items-center gap-2">
              {battle.generatedSong?.audioUrl && (
                <Music2 size={12} className="text-green-400" />
              )}
              {battle.votingEnabled && (
                <ThumbsUp size={12} className="text-cyan-400" />
              )}
              {battle.commentsEnabled && (
                <MessageSquare size={12} className="text-purple-400" />
              )}
            </div>
          </div>
        </div>
        <Dialogs />
      </div>
    );
  }

  // ============================================
  // VARIANT: HORIZONTAL (Sleek two-line card)
  // ============================================
  if (variant === "horizontal") {
    return (
      <div
        className={cn(
          "group relative bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/4 hover:border-white/8 rounded-xl overflow-hidden transition-all duration-200",
          (isDeleting || isPending) && "opacity-50 pointer-events-none",
          (hasMenu || hasAction) && "cursor-pointer"
        )}
        onClick={handleCardClick}
      >
        {/* Status indicator line */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[3px]",
            isLive && "bg-linear-to-b from-red-500 to-orange-500",
            isCompleted && "bg-linear-to-b from-emerald-500 to-teal-500",
            isPaused && "bg-linear-to-b from-amber-500 to-yellow-500",
            !isLive &&
              !isCompleted &&
              !isPaused &&
              "bg-linear-to-b from-zinc-600 to-zinc-700"
          )}
        />

        {/* Content */}
        <div className="py-3 pl-5 pr-4">
          {/* Row 1: Players, Score, Status & Actions */}
          <div className="flex items-center gap-4">
            {/* Players section */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* Grouped Avatars */}
              <div className="flex -space-x-3 shrink-0">
                <div
                  className={cn(
                    "relative w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-900 z-20 transition-all",
                    winnerPosition === "player1" && "ring-2 ring-yellow-400/80"
                  )}
                >
                  <Image
                    src={personas.player1.avatar}
                    alt={personas.player1.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div
                  className={cn(
                    "relative w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-900 z-10 transition-all",
                    winnerPosition === "player2" && "ring-2 ring-yellow-400/80"
                  )}
                >
                  <Image
                    src={personas.player2.avatar}
                    alt={personas.player2.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Names */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={cn(
                    "font-semibold text-sm truncate",
                    winnerPosition === "player1"
                      ? "text-yellow-400"
                      : "text-white"
                  )}
                >
                  {personas.player1.name}
                </span>
                {winnerPosition === "player1" && (
                  <span className="text-sm shrink-0">👑</span>
                )}

                {/* Score or VS */}
                {isCompleted ? (
                  <div className="flex items-center gap-1.5 font-mono text-sm font-bold px-2 shrink-0">
                    <span
                      className={
                        winnerPosition === "player1"
                          ? "text-yellow-400"
                          : "text-white/60"
                      }
                    >
                      {finalStats?.player1TotalScore}
                    </span>
                    <span className="text-white/20">-</span>
                    <span
                      className={
                        winnerPosition === "player2"
                          ? "text-yellow-400"
                          : "text-white/60"
                      }
                    >
                      {finalStats?.player2TotalScore}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-white/25 uppercase tracking-widest px-2 shrink-0">
                    vs
                  </span>
                )}

                {winnerPosition === "player2" && (
                  <span className="text-sm shrink-0">👑</span>
                )}
                <span
                  className={cn(
                    "font-semibold text-sm truncate",
                    winnerPosition === "player2"
                      ? "text-yellow-400"
                      : "text-white"
                  )}
                >
                  {personas.player2.name}
                </span>
              </div>
            </div>

            {/* Meta info - desktop only (inline) */}
            <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
              <span>
                {stage.flag} {stage.name}
              </span>
              <span className="text-white/20">·</span>
              <span>
                {battle.createdAt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {isPaused && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-amber-400/70">
                    R{getDisplayRound(currentRound)}
                  </span>
                </>
              )}
              {(battle.generatedSong?.audioUrl ||
                battle.votingEnabled ||
                battle.commentsEnabled ||
                isArchived) && (
                <>
                  <span className="text-white/20">·</span>
                  <div className="flex items-center gap-1.5">
                    {isArchived && (
                      <Radio size={11} className="text-gray-400" />
                    )}
                    {battle.generatedSong?.audioUrl && (
                      <Music2 size={11} className="text-emerald-400/70" />
                    )}
                    {battle.votingEnabled && (
                      <ThumbsUp size={11} className="text-blue-400/70" />
                    )}
                    {battle.commentsEnabled && (
                      <MessageSquare size={11} className="text-purple-400/70" />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right - Status & Action */}
            <div className="flex items-center gap-3 ml-auto shrink-0">
              {/* Status badge */}
              {isLive && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Live
                  </span>
                </div>
              )}

              {/* Action button */}
              {(isLive || isPaused) && (
                <Link
                  href={`/battle/${battle.id}`}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                    isLive
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isLive ? "Join" : "Resume"}
                </Link>
              )}

              {/* Menu */}
              {hasMenu && <MenuDropdown />}
            </div>
          </div>

          {/* Row 2: Meta info - mobile only (centered) */}
          <div className="flex md:hidden items-center justify-center gap-2 mt-2 text-xs text-white/40">
            <span>
              {stage.flag} {stage.name}
            </span>
            <span className="text-white/20">·</span>
            <span>
              {battle.createdAt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
            {isPaused && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-amber-400/70">
                  R{getDisplayRound(currentRound)}
                </span>
              </>
            )}
            {(battle.generatedSong?.audioUrl ||
              battle.votingEnabled ||
              battle.commentsEnabled ||
              isArchived) && (
              <>
                <span className="text-white/20">·</span>
                <div className="flex items-center gap-1.5">
                  {isArchived && <Radio size={11} className="text-gray-400" />}
                  {battle.generatedSong?.audioUrl && (
                    <Music2 size={11} className="text-emerald-400/70" />
                  )}
                  {battle.votingEnabled && (
                    <ThumbsUp size={11} className="text-blue-400/70" />
                  )}
                  {battle.commentsEnabled && (
                    <MessageSquare size={11} className="text-purple-400/70" />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <Dialogs />
      </div>
    );
  }

  // ============================================
  // VARIANT: ORIGINAL (Default)
  // ============================================
  return (
    <div
      className={cn(
        "group relative flex flex-col md:flex-row md:items-center bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-lg overflow-hidden transition-all duration-200 hover:bg-zinc-900/80 hover:border-white/10",
        (isDeleting || isPending) && "opacity-50 pointer-events-none",
        (hasMenu || hasAction) && "cursor-pointer"
      )}
      onClick={handleCardClick}
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
        {hasMenu && (
          <div className="absolute top-2 right-2 md:top-auto md:bottom-auto md:right-4 z-20">
            <MenuDropdown />
          </div>
        )}

        {/* Left: Matchup & Meta */}
        <div
          className="flex-1 min-w-0 group-hover:opacity-100 pr-8 md:pr-0" // Add padding right to avoid overlap with menu on mobile
        >
          <div className="flex flex-col gap-1">
            {/* Matchup Title */}
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-x-3 gap-y-1 text-lg md:text-xl font-bebas tracking-wide leading-tight">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-blue-400/30 shrink-0">
                  <Image
                    src={personas.player1.avatar}
                    alt={personas.player1.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-blue-400 truncate">
                  {personas.player1.name}
                </span>
                {isCompleted && winnerPosition === "player1" && (
                  <span title="Winner" className="shrink-0 text-base">
                    🏆
                  </span>
                )}
                <span className="text-gray-600 text-sm font-sans italic font-bold ml-1">
                  vs
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-red-400/30 shrink-0">
                  <Image
                    src={personas.player2.avatar}
                    alt={personas.player2.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-red-400 truncate">
                  {personas.player2.name}
                </span>
                {isCompleted && winnerPosition === "player2" && (
                  <span title="Winner" className="shrink-0 text-base">
                    🏆
                  </span>
                )}
              </div>
            </div>

            {/* Subtext: Stage • Date */}
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-sm text-gray-500 uppercase tracking-wider mt-1">
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
                  battle.commentsEnabled ||
                  isArchived) && (
                  <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
                    {isArchived && (
                      <Radio size={12} className="text-gray-400" />
                    )}
                    {battle.generatedSong?.audioUrl && (
                      <Music2 size={12} className="text-green-400" />
                    )}
                    {battle.votingEnabled && (
                      <ThumbsUp size={12} className="text-blue-400" />
                    )}
                    {battle.commentsEnabled && (
                      <MessageSquare size={12} className="text-purple-400" />
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
                  <div className="flex items-center gap-2 ml-2 border-l border-white/10 pl-2 text-sm font-semibold text-gray-400">
                    <span>
                      {finalStats?.player1TotalScore}-
                      {finalStats?.player2TotalScore}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle/Right: Status & Outcome & Actions */}
        <div
          className={cn(
            "flex flex-col md:flex-row items-end md:items-center gap-3 md:gap-4 md:ml-auto",
            hasMenu && "md:pr-12"
          )}
        >
          <div className="flex flex-row md:flex-col md:items-end gap-3 md:gap-1 min-w-[140px] md:text-right">
            {isLive ? (
              <>
                <span className="flex items-center gap-1.5 text-sm font-bold text-red-400 animate-pulse uppercase tracking-wide">
                  <Radio size={12} className="fill-current" />
                  Live Now
                </span>
                <span className="text-sm text-gray-300">
                  Round {getDisplayRound(currentRound)}
                </span>
              </>
            ) : null}
          </div>

          {/* Action Button - Only show if actionable (Live/Paused) */}
          {(isLive || isPaused) && (
            <div className={cn("flex items-center gap-2 mt-2 md:mt-0")}>
              <Link
                href={`/battle/${battle.id}`}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                  isLive
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {isLive ? "Join" : "Resume"}
              </Link>
            </div>
          )}
        </div>
      </div>

      <Dialogs />
    </div>
  );
}
