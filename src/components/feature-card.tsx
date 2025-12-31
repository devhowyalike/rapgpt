import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type FeatureCardColor = "red" | "yellow" | "blue" | "green" | "purple";

const COLOR_CLASSES: Record<FeatureCardColor, { icon: string; bg: string }> = {
  red: { icon: "text-red-500", bg: "bg-red-500/10" },
  yellow: { icon: "text-yellow-500", bg: "bg-yellow-500/10" },
  blue: { icon: "text-blue-500", bg: "bg-blue-500/10" },
  green: { icon: "text-green-500", bg: "bg-green-500/10" },
  purple: { icon: "text-purple-500", bg: "bg-purple-500/10" },
};

interface FeatureCardProps {
  icon: ReactNode;
  title: ReactNode;
  description: string;
  color: FeatureCardColor;
  showGridBackground?: boolean;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  color,
  showGridBackground = false,
  className,
}: FeatureCardProps) {
  const colors = COLOR_CLASSES[color];

  return (
    <div
      className={cn(
        "p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300",
        "flex flex-col items-center text-center gap-3 w-full relative overflow-hidden group",
        className
      )}
    >
      {showGridBackground && (
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] opacity-10 pointer-events-none" />
      )}

      <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 relative z-10">
        <div
          className={cn(
            "inline-flex p-2 rounded-lg shrink-0 border border-white/10 group-hover:scale-110 transition-transform",
            colors.bg
          )}
        >
          <span
            className={cn(
              colors.icon,
              "scale-90 md:scale-100 [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6"
            )}
          >
            {icon}
          </span>
        </div>
        <h3 className="text-lg md:text-xl font-bold font-(family-name:--font-bebas-neue) tracking-wide uppercase leading-tight text-zinc-300">
          {title}
        </h3>
      </div>

      <p className="text-xs md:text-sm leading-relaxed text-zinc-500 text-balance relative z-10">
        {description}
      </p>
    </div>
  );
}
