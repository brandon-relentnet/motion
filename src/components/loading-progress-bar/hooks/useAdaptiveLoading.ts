"use client";

import { animate, clamp, type AnimationPlaybackControls, type MotionValue } from "motion";
import { useCallback, useEffect, useRef } from "react";
import { useMotionValue } from "motion/react";

type ResetOptions = {
  animate?: boolean;
};

type AdaptiveLoadingOptions = {
  progress?: MotionValue<number>;
  autoStart?: boolean;
  initialValue?: number;
};

export function useAdaptiveLoading(options: AdaptiveLoadingOptions = {}) {
  const { progress: externalProgress, autoStart = true, initialValue = 0 } = options;
  const fallbackProgress = useMotionValue(initialValue);
  const progress = externalProgress ?? fallbackProgress;
  const timeoutRef = useRef<number | null>(null);
  const lastTargetRef = useRef(0);
  const animRef = useRef<AnimationPlaybackControls | null>(null);

  const durationForDelta = (delta: number) => {
    const d = clamp(0, 1, Math.abs(delta));
    const MIN = 0.1;
    const MAX = 0.95;
    const shaped = Math.pow(d, 0.8);
    return MAX - (MAX - MIN) * shaped;
  };

  const animateTo = useCallback(
    (next: number) => {
      const current = lastTargetRef.current;
      const delta = next - current;

      animRef.current?.stop();
      const controls = animate(progress, next, {
        duration: durationForDelta(delta),
        ease: "linear",
      });

      animRef.current = controls;
      controls.finished.finally(() => {
        if (animRef.current === controls) {
          animRef.current = null;
        }
      });

      lastTargetRef.current = next;
    },
    [progress]
  );

  const randomStep = () => {
    const r = Math.random();
    if (r < 0.08) return 0.25 + Math.random() * 0.2;
    if (r < 0.3) return 0.06 + Math.random() * 0.12;
    return 0.004 + Math.random() * 0.03;
  };

  const randomDelay = () => {
    const r = Math.random();
    if (r < 0.1) return 900 + Math.random() * 900;
    return 80 + Math.random() * 620;
  };

  const scheduleNext = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      const current = lastTargetRef.current;
      const next = current + randomStep();

      if (next >= 1) {
        animateTo(1);
        if (timeoutRef.current != null) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      animateTo(next);
      scheduleNext();
    }, randomDelay());
  }, [animateTo]);

  const start = useCallback(() => {
    if (timeoutRef.current != null) return;
    scheduleNext();
  }, [scheduleNext]);

  useEffect(() => {
    if (autoStart) start();
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      animRef.current?.stop();
    };
  }, [autoStart, start]);

  const reset = useCallback(
    (options?: ResetOptions) => {
      const animateBack = options?.animate ?? true;

      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const current = lastTargetRef.current;
      const existingControls = animRef.current;
      existingControls?.stop();

      if (!animateBack || current <= 0) {
        progress.set(0);
        lastTargetRef.current = 0;
        if (animRef.current === existingControls) {
          animRef.current = null;
        }
        return;
      }

      const dist = current;
      const MIN = 0.18;
      const MAX = 0.9;
      const duration = Math.min(MAX, Math.max(MIN, dist * 0.85));

      const controls = animate(progress, 0, {
        duration,
        ease: [0.05, 0.9, 0.2, 1],
      });

      animRef.current = controls;
      controls.finished.finally(() => {
        if (animRef.current === controls) {
          lastTargetRef.current = 0;
          progress.set(0);
          animRef.current = null;
        }
      });
    },
    [progress]
  );

  return { progress, start, reset };
}
