"use client";

import { ReactNode } from "react";

interface SelectionBottomProps {
  children: ReactNode;
}

export function SelectionBottom({ children }: SelectionBottomProps) {
  return (
    <div className="bg-linear-to-t from-black/90 via-black/70 to-transparent flex-1 flex flex-col py-4">
      {children}
    </div>
  );
}

