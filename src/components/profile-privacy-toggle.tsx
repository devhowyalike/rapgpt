"use client";

import { useState } from "react";
import { Globe, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfilePrivacyToggleProps {
  initialIsPublic: boolean;
}

export function ProfilePrivacyToggle({
  initialIsPublic,
}: ProfilePrivacyToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
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

  return (
    <button
      onClick={handleToggle}
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
  );
}
