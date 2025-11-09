/**
 * Animated robot for score calculation
 */

"use client";

export function ScoreCalcAnimation() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Robot head with blinking antenna */}
      <div className="relative">
        <span className="text-2xl animate-bounce">🤖</span>
        <span
          className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs animate-ping"
          style={{ animationDuration: "1.5s" }}
        >
          💡
        </span>
      </div>
      {/* Animated gears */}
      <span
        className="text-lg animate-spin"
        style={{ animationDuration: "2s" }}
      >
        ⚙️
      </span>
    </div>
  );
}
