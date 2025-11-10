/**
 * Navigation guard hook - prevents navigation during critical operations
 */

"use client";

import { useEffect, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
      <Dialog.Root open={showDialog} onOpenChange={setShowDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-xl font-bold text-white mb-2">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-gray-400 mb-4">
                  {message}
                </Dialog.Description>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCancelNavigation}
                    disabled={isConfirming}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                  >
                    Stay on Page
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmNavigation}
                    disabled={isConfirming}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
                  >
                    {isConfirming ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Leaving...
                      </>
                    ) : (
                      "Leave Page"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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
