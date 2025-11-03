"use client";

import { ReactNode } from "react";

interface CenterDisplayProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function CenterDisplay({ title, subtitle, children }: CenterDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center px-1 md:px-4 lg:px-8">
      <div className="text-center mb-1">
        <div className="text-base md:text-3xl lg:text-5xl font-black text-transparent bg-clip-text bg-linear-to-b from-yellow-400 via-orange-500 to-red-600 tracking-wider drop-shadow-[0_0_30px_rgba(251,191,36,0.8)] mb-0.5">
          {title}
        </div>
        <div className="text-xs md:text-xl lg:text-3xl font-black text-white tracking-[0.3em] md:tracking-[0.5em] drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
          {subtitle}
        </div>
      </div>
      {children}
    </div>
  );
}

