"use client";

import { ReactNode } from "react";

interface SelectionBottomProps {
  children: ReactNode;
}

export function SelectionBottom({ children }: SelectionBottomProps) {
  return (
    <div className="bg-linear-to-t from-black/90 via-black/70 to-transparent pt-2 pb-4">
      {children}
    </div>
  );
}

