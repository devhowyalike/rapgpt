/**
 * Navigation guard hook - prevents navigation during critical operations
 */

"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UseNavigationGuardOptions {
  when: boolean;
  message?: string;
  title?: string;
  onConfirm?: () => Promise<void> | void;
}

export function useNavigationGuard({
  when,
  message = "Are you sure you want to leave? Your progress will be lost.",
  title = "Leave page?",
  onConfirm,
}: UseNavigationGuardOptions) {
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const [navigationConfirmed, setNavigationConfirmed] = useState(false);

  // Browser navigation (refresh, close tab, back button) is allowed without warning
  // We only show the custom dialog for internal link clicks

  // Intercept internal link clicks
  useEffect(() => {
    if (!when) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");

      // Only intercept internal navigation
      if (!href || href.startsWith("#") || href.startsWith("http")) return;

      // Check if navigating away from current page
      if (href === pathname) return;

      // Prevent navigation and show dialog
      e.preventDefault();
      e.stopPropagation();
      setPendingNavigation(href);
      setShowDialog(true);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [when, pathname]);

  const handleConfirmNavigation = useCallback(async () => {
    setIsConfirming(true);

    try {
      // Execute the onConfirm callback if provided (e.g., save battle state)
      if (onConfirm) {
        await onConfirm();
      }

      // Mark navigation as confirmed to prevent browser's beforeunload dialog
      setNavigationConfirmed(true);

      // Navigate to the pending URL
      if (pendingNavigation) {
        window.location.href = pendingNavigation;
      }
    } catch (error) {
      console.error("Error during navigation confirmation:", error);
      setIsConfirming(false);
      // Don't close dialog on error
      return;
    }
  }, [onConfirm, pendingNavigation]);

  const handleCancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
    setIsConfirming(false);
  }, []);

  const NavigationDialog = useCallback(
    () => (
      <ConfirmationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={title}
        description={message}
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        isLoading={isConfirming}
        confirmLabel="Pause Match"
        cancelLabel="Stay on Page"
        variant="danger"
      />
    ),
    [
      showDialog,
      title,
      message,
      isConfirming,
      handleConfirmNavigation,
      handleCancelNavigation,
    ]
  );

  return {
    NavigationDialog,
    isBlocking: when,
  };
}
