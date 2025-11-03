"use client";

import { ReactNode } from "react";

interface SelectionContainerProps {
  children: ReactNode;
}

export function SelectionContainer({ children }: SelectionContainerProps) {
  return (
    <div className="flex items-center justify-between pb-0">{children}</div>
  );
}
