"use client";

import { useState, useEffect } from "react";
import { Globe, Lock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";

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
      <Dialog.Root open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isPublic ? "bg-orange-500/20" : "bg-green-500/20"
                }`}
              >
                <AlertTriangle
                  className={`w-6 h-6 ${
                    isPublic ? "text-orange-500" : "text-green-500"
                  }`}
                />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-xl font-bold text-white mb-2">
                  {isPublic ? "Make Profile Private?" : "Make Profile Public?"}
                </Dialog.Title>
                <Dialog.Description className="text-gray-400 mb-4">
                  {isPublic
                    ? "Making your profile private will automatically unpublish any currently public battles. Your battles won't be deleted, but they will no longer appear on your public profile."
                    : "Making your profile public will allow others to view your profile and any battles you choose to publish. You can individually publish battles after making your profile public."}
                </Dialog.Description>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={isToggling}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleToggle}
                    disabled={isToggling}
                    className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                      isPublic
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isToggling
                      ? isPublic
                        ? "Making Private..."
                        : "Making Public..."
                      : isPublic
                      ? "Make Private"
                      : "Make Public"}
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
