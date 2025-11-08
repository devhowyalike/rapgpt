"use client";

import { useEffect, useRef, useState } from "react";

interface VictoryConfettiProps {
  trigger: boolean;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle";
  life: number; // seconds
  maxLife: number; // seconds
};

const CONFETTI_COLORS = [
  "#fbbf24",
  "#facc15",
  "#ef4444",
  "#dc2626",
  "#a855f7",
  "#9333ea",
  "#3b82f6",
  "#2563eb",
  "#10b981",
  "#059669",
  "#ec4899",
  "#db2777",
  "#f97316",
  "#ea580c",
];

export function VictoryConfetti({ trigger }: VictoryConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    setActive(true);
  }, [trigger]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const fitToWrapper = () => {
      const rect = wrapper.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fitToWrapper();

    // Watch wrapper size changes
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        fitToWrapper();
      });
      ro.observe(wrapper);
      resizeObserverRef.current = ro;
    }

    // Initialize particles
    const particles: Particle[] = [];
    const now = performance.now();
    const durationMs = 4000;
    const endTime = now + durationMs;

    const width = () => canvas.clientWidth || canvas.width / dpr;
    const height = () => canvas.clientHeight || canvas.height / dpr;

    const createParticles = (count: number) => {
      for (let i = 0; i < count; i++) {
        const w = width();
        const h = height();
        const startX = Math.random() * w;
        const startY = h * 0.5;
        const angle = Math.PI / 4 + (Math.random() * Math.PI) / 2; // 45-135 deg
        const speed = 150 + Math.random() * 200; // px/s
        const vx = Math.cos(angle) * speed;
        const vy = -Math.sin(angle) * speed; // upwards
        const size = 6 + Math.random() * 10;
        const color =
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const rotation = Math.random() * Math.PI * 2;
        const rotationSpeed =
          (Math.random() > 0.5 ? 1 : -1) * (Math.PI * (0.5 + Math.random()));
        const maxLife = 2 + Math.random() * 1.5; // seconds

        particles.push({
          x: startX,
          y: startY,
          vx,
          vy,
          size,
          color,
          rotation,
          rotationSpeed,
          shape: Math.random() > 0.7 ? "circle" : "rect",
          life: 0,
          maxLife,
        });
      }
    };

    // More particles for a celebratory effect
    createParticles(100);

    let prev = performance.now();
    const gravity = 900; // px/s^2
    const drag = 0.0008; // proportional velocity decay

    const frame = () => {
      const t = performance.now();
      const dt = Math.min(0.032, (t - prev) / 1000); // cap dt at ~30fps for stability
      prev = t;

      ctx.clearRect(0, 0, width(), height());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Update physics
        p.vx *= 1 - drag;
        p.vy *= 1 - drag;
        p.vy += gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        p.life += dt;

        // Draw with fade near end of life
        const alpha =
          p.life < p.maxLife * 0.8
            ? 1
            : Math.max(0, 1 - (p.life - p.maxLife * 0.8) / (p.maxLife * 0.2));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;

        // Remove expired particles
        if (p.life > p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // Keep animating until endTime; allow particles to naturally fade
      if (t < endTime || particles.length > 0) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        // Done
        setActive(false);
      }
    };

    rafRef.current = requestAnimationFrame(frame);

    // Hard stop after duration to match previous behavior
    stopTimeoutRef.current = window.setTimeout(() => {
      // Let particles finish; active state will be set false when particles end
    }, durationMs) as unknown as number;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      ctx.clearRect(0, 0, width(), height());
      setActive(false);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 pointer-events-none overflow-visible z-0"
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
