"use client";

import { ReactNode } from "react";

interface SelectionGridProps {
  children: ReactNode;
  gap?: "normal" | "large";
}

export function SelectionGrid({
  children,
  gap = "normal",
}: SelectionGridProps) {
  const gapClasses =
    gap === "large" ? "gap-4 md:gap-8 lg:gap-10" : "gap-3 md:gap-6 lg:gap-8";

  const paddingClasses = gap === "large" ? "pb-4 md:pb-8" : "";

  return (
    <div
      className={`max-w-5xl mx-auto px-2 md:px-4 lg:px-8 mb-3 ${paddingClasses}`}
    >
      <div
        className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 justify-items-center items-center ${gapClasses}`}
      >
        {children}
      </div>
    </div>
  );
}
