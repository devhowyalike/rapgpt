"use client";

import { Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";

interface DeleteBattleButtonProps {
  battleId: string;
  battleTitle: string;
}

export function DeleteBattleButton({
  battleId,
  battleTitle,
}: DeleteBattleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/battle/${battleId}/delete`, {
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
        setErrorMessage(data.error || "Failed to delete battle");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting battle:", error);
      setErrorMessage("Failed to delete battle");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDeleteDialog(true)}
        disabled={isDeleting || isPending}
        className="p-2 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete battle"
      >
        <Trash2 size={18} />
      </button>

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
                  Are you sure you want to delete "{battleTitle}"? This will
                  also delete all votes and comments. This action cannot be
                  undone.
                </Dialog.Description>

                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}

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
    </>
  );
}
