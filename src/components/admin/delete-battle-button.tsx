"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${battleTitle}"? This will also delete all votes and comments.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/battle/${battleId}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
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
      console.error("Error deleting battle:", error);
      alert("Failed to delete battle");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting || isPending}
      className="p-2 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete battle"
    >
      <Trash2 size={18} />
    </button>
  );
}
