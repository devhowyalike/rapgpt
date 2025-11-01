/**
 * Custom hook to check if there are any archived battles
 * (completed battles that were previously live)
 * 
 * This can be used anywhere in the app to conditionally show archive-related UI
 */

import { useEffect, useState } from "react";

interface UseHasArchivedBattlesOptions {
  enabled?: boolean;
}

export function useHasArchivedBattles({ enabled = true }: UseHasArchivedBattlesOptions = {}) {
  const [hasArchived, setHasArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const checkForArchivedBattles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/battle/has-archived");
        if (response.ok) {
          const data = await response.json();
          setHasArchived(data.hasArchived || false);
        } else {
          setHasArchived(false);
        }
      } catch (err) {
        console.error("[useHasArchivedBattles] Error checking for archived battles:", err);
        setHasArchived(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch on mount
    checkForArchivedBattles();

    // Refresh when page becomes visible (e.g., switching tabs or navigating back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForArchivedBattles();
      }
    };

    // Refresh when window gains focus
    const handleFocus = () => {
      checkForArchivedBattles();
    };

    // Listen for custom events in case battles are archived
    const handleBattleStatusChange = () => {
      checkForArchivedBattles();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("battle:status-changed", handleBattleStatusChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        "battle:status-changed",
        handleBattleStatusChange
      );
    };
  }, [enabled]);

  return {
    hasArchived,
    isLoading,
  };
}

