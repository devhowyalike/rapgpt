import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GridBackground } from "./grid-background";

interface PageHeroProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function PageHero({
  children,
  className,
  containerClassName,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative pt-20 pb-6 md:pt-32 md:pb-8 overflow-hidden bg-black text-white selection:bg-yellow-500/30 shrink-0",
        className
      )}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0" />
      <GridBackground className="z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div
        className={cn(
          "container mx-auto px-4 relative z-10 text-center",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
