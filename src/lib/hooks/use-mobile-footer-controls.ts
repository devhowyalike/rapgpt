/**
 * Compute mobile footer related offsets and paddings in one place.
 *
 * Scenarios handled:
 * - Baseline bottom controls bar (Scores/Song) on completed battles
 * - Optional mobile FABs (Floating Action Buttons) for comments/voting
 * - Desktop should never receive the FAB padding; consumers keep their own md: padding
 */

export interface MobileFooterControlsOptions {
  /** Whether a fixed bottom controls bar is present (e.g., replay Scores/Song) */
  hasBottomControls: boolean;
  /** Feature flags */
  showCommenting: boolean;
  showVoting: boolean;
  /** Whether the settings gear is present (always true for active battles) */
  hasSettings?: boolean;
}

export interface MobileFooterControlsResult {
  /**
   * Optional override for the content scroll container padding-bottom (mobile only).
   * If undefined, consumers should apply their own baseline (typically var(--bottom-controls-height)).
   */
  contentPaddingOverride?: string;
  /** Bottom offset for mobile FABs (Floating Action Buttons) */
  fabBottomOffset?: string;
  /** Padding-bottom for control bars to clear FABs on mobile (e.g., "pb-24" worth of space) */
  controlBarMobilePadding?: string;
}

export function useMobileFooterControls(
  options: MobileFooterControlsOptions
): MobileFooterControlsResult {
  const { hasBottomControls, showCommenting, showVoting, hasSettings = false } = options;

  const hasFabs = showCommenting || showVoting || hasSettings;

  // If FABs are present, content needs additional space on mobile.
  // Otherwise, return undefined so callers keep their baseline padding.
  const contentPaddingOverride = hasFabs
    ? hasBottomControls
      ? "calc(var(--bottom-controls-height) + var(--fab-size) + var(--fab-gutter))"
      : "calc(var(--fab-size) + var(--fab-gutter))"
    : undefined;

  // Position FABs just above the bottom controls when present
  const fabBottomOffset = hasFabs
    ? hasBottomControls
      ? "calc(var(--bottom-controls-height) + var(--fab-gutter))"
      : undefined
    : undefined;

  // Control bars need extra mobile padding when FABs are present
  // Base padding + FAB height + gutter between FAB and control bar
  const controlBarMobilePadding = hasFabs
    ? "calc(var(--control-bar-base-padding) + var(--fab-size) + var(--fab-gutter))"
    : undefined;

  return {
    contentPaddingOverride,
    fabBottomOffset,
    controlBarMobilePadding,
  };
}
