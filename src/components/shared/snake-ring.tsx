"use client";

interface SnakeRingProps {
  isPlayer1: boolean;
  inset?: string;
  strokeWidth?: string;
  strokeDasharray?: string;
  opacity?: string;
  radius?: number;
}

export function SnakeRing({
  isPlayer1,
  inset = "inset-0",
  strokeWidth = "4",
  strokeDasharray = "75 225",
  opacity = "0.9",
  radius = 48,
}: SnakeRingProps) {
  return (
    <div className={`absolute ${inset} pointer-events-none z-20`}>
      <svg
        className="absolute inset-0 w-full h-full animate-[snake-ring_3s_linear_infinite]"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={isPlayer1 ? "rgb(59, 130, 246)" : "rgb(239, 68, 68)"}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          opacity={opacity}
        />
      </svg>
    </div>
  );
}

