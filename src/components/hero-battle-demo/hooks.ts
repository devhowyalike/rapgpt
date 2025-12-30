"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// RAF-based Animation Progress Hook
// =============================================================================

interface UseAnimationProgressOptions {
  duration: number;
  isPaused: boolean;
  enabled?: boolean;
}

/**
 * Hook that tracks animation progress using requestAnimationFrame.
 * Pause-aware and returns progress from 0 to 100.
 */
export function useAnimationProgress({
  duration,
  isPaused,
  enabled = true,
}: UseAnimationProgressOptions) {
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || isPaused) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      lastTimestampRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      elapsedRef.current = Math.min(duration, elapsedRef.current + deltaTime);
      const newProgress = (elapsedRef.current / duration) * 100;
      setProgress(newProgress);

      if (elapsedRef.current < duration) {
        rafIdRef.current = requestAnimationFrame(animate);
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [duration, isPaused, enabled]);

  const reset = useCallback(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, []);

  return { progress, reset };
}

// =============================================================================
// RAF-based Elapsed Time Hook
// =============================================================================

interface UseElapsedTimeOptions {
  isPaused: boolean;
  enabled?: boolean;
}

/**
 * Hook that tracks elapsed time in milliseconds using requestAnimationFrame.
 * Useful for streaming text animations.
 */
export function useElapsedTime({ isPaused, enabled = true }: UseElapsedTimeOptions) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setElapsedTime(0);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      lastTimestampRef.current = null;
      return;
    }

    if (isPaused) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      lastTimestampRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      setElapsedTime((prev) => prev + deltaTime);
      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isPaused, enabled]);

  const reset = useCallback(() => {
    setElapsedTime(0);
  }, []);

  return { elapsedTime, reset };
}

// =============================================================================
// Intersection Observer Hook
// =============================================================================

interface UseInViewOptions {
  threshold?: number;
  onEnter?: () => void;
  onLeave?: () => void;
}

export function useInView<T extends HTMLElement>({
  threshold = 0.3,
  onEnter,
  onLeave,
}: UseInViewOptions = {}) {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  const isInViewRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasInView = isInViewRef.current;
        const nowInView = entry.isIntersecting;

        isInViewRef.current = nowInView;
        setIsInView(nowInView);

        if (!wasInView && nowInView) {
          onEnter?.();
        } else if (wasInView && !nowInView) {
          onLeave?.();
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, onEnter, onLeave]);

  return { ref, isInView, isInViewRef };
}

// =============================================================================
// Touch/Swipe Navigation Hook
// =============================================================================

interface UseSwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  maxSwipeTime?: number;
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  maxSwipeTime = 500,
}: UseSwipeNavigationOptions = {}) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartTimeRef.current;

      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

      if (
        isHorizontalSwipe &&
        Math.abs(deltaX) >= minSwipeDistance &&
        deltaTime <= maxSwipeTime
      ) {
        if (deltaX < 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }

      touchStartRef.current = null;
    },
    [minSwipeDistance, maxSwipeTime, onSwipeLeft, onSwipeRight]
  );

  return { handleTouchStart, handleTouchEnd };
}

