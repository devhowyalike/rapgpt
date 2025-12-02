"use client";

interface VsGlowProps {
  visible?: boolean;
  color?: "player1" | "player2";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VsGlow({
  visible = true,
  color = "player2",
  size = "md",
  className = "",
}: VsGlowProps) {
  const sizeClasses =
    size === "sm"
      ? "text-base md:text-lg"
      : size === "lg"
        ? "text-2xl md:text-3xl lg:text-4xl"
        : "text-lg md:text-xl lg:text-2xl";

  const colorClasses =
    color === "player1"
      ? "text-[rgb(var(--player1-color))] drop-shadow-[0_0_20px_rgba(var(--player1-color),0.8)]"
      : "text-[rgb(var(--player2-color))] drop-shadow-[0_0_20px_rgba(var(--player2-color),0.8)]";

  return (
    <div
      className={`${sizeClasses} font-black ${colorClasses} animate-pulse transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      VS
    </div>
  );
}
