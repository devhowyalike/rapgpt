import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  /** Opacity level: "subtle" (10%) or "normal" (20%). Defaults to "normal" */
  intensity?: "subtle" | "normal";
  className?: string;
}

export function GridBackground({
  intensity = "normal",
  className,
}: GridBackgroundProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-[url('/assets/grid.svg')] bg-center pointer-events-none",
        "mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]",
        intensity === "subtle" ? "opacity-10" : "opacity-20",
        className
      )}
    />
  );
}

