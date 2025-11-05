"use client";

import { SiteHeader } from "../site-header";
import { ReactNode } from "react";

interface SelectionLayoutProps {
  title: string;
  children: ReactNode;
}

export function SelectionLayout({ title, children }: SelectionLayoutProps) {
  return (
    <>
      <SiteHeader />
      <div style={{ height: "var(--header-height)" }} />
      <div className="bg-linear-to-b from-gray-950 via-gray-900 to-black relative flex-1 flex flex-col">
        {/* Dramatic Background Effect */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
        <div className="fixed inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

        {/* Main Container */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Page Hero */}
          <div className="px-2 md:px-8 lg:px-16 py-4 md:py-6 lg:py-8 shrink-0">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="absolute -inset-x-12 -top-6 -bottom-6 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.15),transparent_60%)] pointer-events-none" />
                <div className="relative text-2xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-sky-300 via-cyan-400 to-teal-500 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)] tracking-tight">
                  {title}
                </div>
                <div className="relative mt-1 md:mt-2 h-[2px] w-28 md:w-40 lg:w-56 mx-auto bg-linear-to-r from-sky-300/60 via-cyan-400/60 to-teal-500/60 rounded-full shadow-[0_0_18px_rgba(34,211,238,0.5)]" />
              </div>
            </div>
          </div>
          {/* Content Max Width Container */}
          <div className="max-w-7xl mx-auto w-full px-2 md:px-4 flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
