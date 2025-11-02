"use client";

import { useEffect } from "react";

/**
 * Ensures only one drawer is open at a time across the page.
 * When this drawer opens, it broadcasts an event so other drawers close.
 */
export function useExclusiveDrawer(
  drawerId: string,
  isOpen: boolean,
  setOpen: (open: boolean) => void
) {
  // Close this drawer if another drawer announces it opened
  useEffect(() => {
    const handleExclusiveOpen = (event: Event) => {
      try {
        const customEvent = event as CustomEvent<string>;
        const openedId = customEvent.detail;
        if (openedId !== drawerId && isOpen) {
          setOpen(false);
        }
      } catch {
        // no-op
      }
    };

    window.addEventListener("exclusive-drawer:open", handleExclusiveOpen as EventListener);
    return () => {
      window.removeEventListener(
        "exclusive-drawer:open",
        handleExclusiveOpen as EventListener
      );
    };
  }, [drawerId, isOpen, setOpen]);

  // Announce when this drawer becomes open
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isOpen) {
      window.dispatchEvent(new CustomEvent("exclusive-drawer:open", { detail: drawerId }));
    }
  }, [drawerId, isOpen]);
}


