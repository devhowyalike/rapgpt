"use client";

import { useState, useEffect } from "react";
import { Globe, Lock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface ProfilePrivacyToggleProps {
  initialIsPublic: boolean;
}

export function ProfilePrivacyToggle({
  initialIsPublic,
}: ProfilePrivacyToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isToggling, setIsToggling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

  // Sync local state with prop when initialIsPublic changes (e.g., after refresh)
  useEffect(() => {
    setIsPublic(initialIsPublic);
  }, [initialIsPublic]);

  const handleButtonClick = () => {
    // Always show confirmation dialog for both directions
    setShowConfirmDialog(true);
  };

  const handleToggle = async () => {
    setIsToggling(true);
    setShowConfirmDialog(false);
    try {
      const response = await fetch("/api/user/toggle-profile-privacy", {
        method: "PATCH",
      });
      const data = await response.json();
      if (data.success) {
        setIsPublic(data.isProfilePublic);
        // Refresh the page from the server to update profile status and battle cards
        router.refresh();
        // Reset the toggling state after a delay to allow the refresh to complete
        setTimeout(() => setIsToggling(false), 800);
      }
    } catch (error) {
      console.error("Failed to toggle profile privacy:", error);
      setIsToggling(false);
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={isToggling}
        className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {isPublic ? (
          <>
            <Lock size={14} />
            Make Profile Private
          </>
        ) : (
          <>
            <Globe size={14} />
            Make Profile Public
          </>
        )}
      </button>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={isPublic ? "Make Profile Private?" : "Make Profile Public?"}
        description={
          isPublic
            ? "Making your profile private will automatically unpublish any currently public battles. Your battles won't be deleted, but they will no longer appear on your public profile."
            : "Making your profile public will allow others to view your profile and any battles you choose to publish. You can individually publish battles after making your profile public."
        }
        confirmLabel={isPublic ? "Make Private" : "Make Public"}
        onConfirm={handleToggle}
        isLoading={isToggling}
        variant={isPublic ? "warning" : "info"}
        icon={AlertTriangle}
      />
    </>
  );
}
