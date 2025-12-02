/**
 * Wrapper component for scrollable drawer content.
 * Use this inside BattleDrawer to get proper mobile scroll behavior.
 *
 * Pattern established from CommentsContent:
 * - Outer flex container fills drawer space
 * - Inner scroll container handles overflow
 *
 * @example
 * <BattleDrawer open={open} onOpenChange={setOpen} title="My Drawer" excludeBottomControls>
 *   <DrawerScrollContent>
 *     <div className="p-4">Your content here</div>
 *   </DrawerScrollContent>
 * </BattleDrawer>
 *
 * @example With fixed footer
 * <BattleDrawer open={open} onOpenChange={setOpen} title="My Drawer" excludeBottomControls>
 *   <DrawerScrollContent
 *     footer={
 *       <div className="p-4 border-t border-gray-800">
 *         <button>Submit</button>
 *       </div>
 *     }
 *   >
 *     <div className="p-4">Scrollable content</div>
 *   </DrawerScrollContent>
 * </BattleDrawer>
 */

"use client";

import type { ReactNode } from "react";

interface DrawerScrollContentProps {
  children: ReactNode;
  /**
   * Optional fixed footer that stays at bottom (like comment input)
   * Will have shrink-0 applied automatically
   */
  footer?: ReactNode;
  /**
   * Additional classes for the scroll container
   */
  className?: string;
}

export function DrawerScrollContent({
  children,
  footer,
  className = "",
}: DrawerScrollContentProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-6 md:pb-4 ${className}`}
      >
        {children}
      </div>
      {footer && (
        <div className="shrink-0 pb-6 md:pb-4 bg-gray-900">{footer}</div>
      )}
    </div>
  );
}

