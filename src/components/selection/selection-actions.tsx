"use client";

import { ReactNode } from "react";

interface SelectionActionsProps {
  children: ReactNode;
}

export function SelectionActions({ children }: SelectionActionsProps) {
  return (
    <div className="max-w-4xl mx-auto px-2 md:px-4 lg:px-8 space-y-2 md:space-y-4 shrink-0">
      {children}
    </div>
  );
}

