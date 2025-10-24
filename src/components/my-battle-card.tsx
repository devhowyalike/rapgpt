"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2, Trash2, AlertTriangle, MoreVertical } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

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
  };
  shareUrl: string;
}

export function MyBattleCard({ battle, shareUrl }: MyBattleCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const personas = {
    left: battle.leftPersona as any,
    right: battle.rightPersona as any,
  };

  const battleUrl = `${shareUrl}/battle/${battle.id}`;

  const handleShare = () => {
    navigator.clipboard.writeText(battleUrl);
    alert("Link copied to clipboard!");
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/battle/${battle.id}/delete`, {
        method: "DELETE",
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete battle:", error);
      setIsDeleting(false);
    }
  };

  // Calculate battle progress stats for paused battles
  const isPaused = battle.status === "incomplete";
  const currentRound = battle.currentRound || 1;
  const versesCount = battle.verses?.length || 0;

  return (
    <div className="h-full flex flex-col bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            href={`/battle/${battle.id}`}
            className="font-bebas text-3xl text-white hover:text-purple-400 transition-colors"
          >
            {battle.title}
          </Link>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="More options"
            >
              <MoreVertical size={18} />
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
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded cursor-pointer outline-none"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={16} />
                Delete Battle
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="flex items-center gap-2 text-sm mb-4">
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
        <span className="text-gray-500">
          Created {new Date(battle.createdAt).toLocaleDateString()}
        </span>
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

      {/* Flexible spacer to push buttons to bottom */}
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <Link
          href={`/battle/${battle.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {battle.status === "incomplete"
            ? "Resume Beef"
            : battle.status === "completed"
            ? "Replay Battle"
            : "View Battle"}
        </Link>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-xl font-bold text-white mb-2">
                  Delete Battle?
                </Dialog.Title>
                <Dialog.Description className="text-gray-400 mb-4">
                  Are you sure you want to delete this beef? This will also
                  delete all votes and comments. This action cannot be undone.
                </Dialog.Description>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete Battle"}
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
