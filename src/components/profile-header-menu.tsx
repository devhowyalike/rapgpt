"use client";

import { useState } from "react";
import { Globe, Lock, MoreVertical, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface ProfileHeaderMenuProps {
  initialIsPublic: boolean;
}

export function ProfileHeaderMenu({ initialIsPublic }: ProfileHeaderMenuProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();
  const { openUserProfile } = useClerk();

  const handleTogglePrivacy = async () => {
    setIsToggling(true);
    try {
      const response = await fetch("/api/user/toggle-profile-privacy", {
        method: "PATCH",
      });
      const data = await response.json();
      if (data.success) {
        setIsPublic(data.isProfilePublic);
        // Refresh the page to update the profile badge
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to toggle profile privacy:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleUpdateProfile = () => {
    // Open Clerk's user profile modal
    openUserProfile();
  };

  return (
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
            onClick={handleTogglePrivacy}
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
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
