"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Lock,
  MoreVertical,
  UserCog,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface ProfileHeaderMenuProps {
  initialIsPublic: boolean;
  userId: string;
}

export function ProfileHeaderMenu({
  initialIsPublic,
  userId,
}: ProfileHeaderMenuProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isToggling, setIsToggling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openUserProfile } = useClerk();
  const isViewingAsPublic = searchParams.get("viewAs") === "public";

  // Sync local state with prop when initialIsPublic changes (e.g., after refresh)
  useEffect(() => {
    setIsPublic(initialIsPublic);
  }, [initialIsPublic]);

  const handlePrivacyClick = () => {
    // Always show confirmation dialog for both directions
    setShowConfirmDialog(true);
  };

  const handleTogglePrivacy = async () => {
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

  const handleUpdateProfile = () => {
    // Open Clerk's user profile modal
    openUserProfile();
  };

  const handleToggleViewMode = () => {
    if (isViewingAsPublic) {
      // Return to normal view
      router.push(`/profile/${userId}`);
    } else {
      // View as public
      router.push(`/profile/${userId}?viewAs=public`);
    }
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Profile options"
          >
            <MoreVertical size={20} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg p-1 shadow-xl z-50"
            sideOffset={5}
            align="end"
          >
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded cursor-pointer outline-none"
              onClick={handleUpdateProfile}
            >
              <UserCog size={16} />
              Manage Account
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded cursor-pointer outline-none"
              onClick={handlePrivacyClick}
              disabled={isToggling}
            >
              {isPublic ? (
                <>
                  <Lock size={16} />
                  Make Profile Private
                </>
              ) : (
                <>
                  <Globe size={16} />
                  Make Profile Public
                </>
              )}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-gray-700 my-1" />
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded cursor-pointer outline-none"
              onClick={handleToggleViewMode}
            >
              <Eye size={16} />
              {isViewingAsPublic ? "View as Owner" : "View as Public"}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

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
        onConfirm={handleTogglePrivacy}
        isLoading={isToggling}
        variant={isPublic ? "warning" : "info"}
        icon={AlertTriangle}
      />
    </>
  );
}
