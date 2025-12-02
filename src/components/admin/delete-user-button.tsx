"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export function DeleteUserButton({
  userId,
  userName,
  userEmail,
}: DeleteUserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/user/${userId}/delete`, {
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
        setErrorMessage(data.error || "Failed to delete user");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setErrorMessage("Failed to delete user");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDeleteDialog(true)}
        disabled={isDeleting || isPending}
        className="p-2 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete user"
      >
        <Trash2 size={18} />
      </button>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete User?"
        description={`Are you sure you want to delete ${userName} (${userEmail})? This will permanently delete:
        
• The user's Clerk authentication account
• The user's database record
• All battles they created
• All their comments and votes

The user will not be able to sign back in. This action cannot be undone.`}
        confirmLabel="Delete User"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="danger"
        icon={AlertTriangle}
        errorMessage={errorMessage || undefined}
      />
    </>
  );
}
