"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";

interface BrowserChromeProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  url?: string;
  showAddressBar?: boolean;
}

export function BrowserChrome({
  children,
  className,
  contentClassName,
  url = APP_URL,
  showAddressBar = false,
}: BrowserChromeProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 transition-all duration-300",
        className
      )}
    >
      {/* Browser Header */}
      <div className="h-8 md:h-10 bg-zinc-900/80 border-b border-white/5 flex items-center px-4 md:px-6">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-zinc-800" />
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-zinc-800" />
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-zinc-800" />
        </div>

        {/* URL Bar */}
        {showAddressBar && (
          <>
            <div className="flex-1 mx-4">
              <div className="max-w-xs mx-auto h-5 md:h-6 bg-zinc-800/50 rounded-md flex items-center justify-center">
                <span className="text-[10px] md:text-xs text-zinc-500 truncate px-2 font-mono">
                  {url}
                </span>
              </div>
            </div>

            {/* Spacer for symmetry on desktop */}
            <div className="hidden md:block w-[42px]" aria-hidden="true" />
          </>
        )}
      </div>

      {/* Content Area */}
      <div
        className={cn(
          "relative w-full aspect-16/10 overflow-hidden bg-zinc-950",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
