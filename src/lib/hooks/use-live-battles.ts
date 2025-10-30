/**
 * Custom hook to manage live battles state and auto-refresh
 * Listens for battle status changes via custom events
 */

import { useEffect, useState } from "react";
import type { Battle } from "@/lib/shared";

interface UseLiveBattlesOptions {
  enabled?: boolean;
}

export function useLiveBattles({ enabled = true }: UseLiveBattlesOptions = {}) {
  const [liveBattles, setLiveBattles] = useState<Battle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchLiveBattles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/battle/live");
        if (response.ok) {
          const data = await response.json();
          setLiveBattles(data.battles || []);
        } else {
          setError("Failed to fetch live battles");
        }
      } catch (err) {
        console.error("[useLiveBattles] Error fetching live battles:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch on mount
    fetchLiveBattles();

    // Refresh when page becomes visible (e.g., switching tabs or navigating back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchLiveBattles();
      }
    };

    // Refresh when window gains focus
    const handleFocus = () => {
      fetchLiveBattles();
    };

    // Listen for custom events from admin control panel
    const handleBattleStatusChange = () => {
      fetchLiveBattles();
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
    liveBattles,
    isLoading,
    error,
  };
}

