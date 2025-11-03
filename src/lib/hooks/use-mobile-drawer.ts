/**
 * Custom hook for managing mobile drawer state
 */

import { useState, useCallback } from "react";

export type DrawerTab = "comments" | "voting";

export function useMobileDrawer(initialTab: DrawerTab = "comments") {
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<DrawerTab>(initialTab);

  const openCommentsDrawer = useCallback(() => {
    setMobileActiveTab("comments");
    setShowMobileDrawer(true);
  }, []);

  const openVotingDrawer = useCallback(() => {
    setMobileActiveTab("voting");
    setShowMobileDrawer(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setShowMobileDrawer(false);
  }, []);

  return {
    showMobileDrawer,
    mobileActiveTab,
    setShowMobileDrawer,
    setMobileActiveTab,
    openCommentsDrawer,
    openVotingDrawer,
    closeDrawer,
  };
}

