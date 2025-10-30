"use client";

import { Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

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

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Battle?"
        description={`Are you sure you want to delete "${battleTitle}"? This will also delete all votes and comments. This action cannot be undone.`}
        confirmLabel="Delete Battle"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="danger"
        icon={AlertTriangle}
        errorMessage={errorMessage || undefined}
      />
    </>
  );
}
