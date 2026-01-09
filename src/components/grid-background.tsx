import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  /** Opacity level: "subtle" (10%), "normal" (20%), or "strong" (30%). Defaults to "normal" */
  intensity?: "subtle" | "normal" | "strong";
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
        intensity === "subtle"
          ? "opacity-10"
          : intensity === "strong"
          ? "opacity-30"
          : "opacity-20",
        className
      )}
    />
  );
}
