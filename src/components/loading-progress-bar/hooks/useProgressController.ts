"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion";
import type { BadgeState } from "../../multi-state-badge";
import { AUTO_RESET_DELAY, COMPLETION_THRESHOLD } from "../constants";

type ProgressControllerOptions = {
  progress: MotionValue<number>;
  start: () => void;
  reset: (options?: { animate?: boolean }) => void;
};

export function useProgressController({
  progress,
  start,
  reset,
}: ProgressControllerOptions) {
  const [badgeState, setBadgeState] = useState<BadgeState>("idle");
  const [progressValue, setProgressValue] = useState(0);
  const revertTimeoutRef = useRef<number | null>(null);

  const clearRevertTimeout = useCallback(() => {
    if (revertTimeoutRef.current == null) return;
    clearTimeout(revertTimeoutRef.current);
    revertTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    const unsubscribe = progress.on("change", (value: number) => {
      setProgressValue(value);
    });

    return () => {
      unsubscribe();
    };
  }, [progress]);

  const handleBadgeClick = useCallback(() => {
    if (badgeState === "idle") {
      clearRevertTimeout();
      reset({ animate: false });
      setBadgeState("processing");
      start();
      return;
    }

    if (badgeState === "processing") {
      clearRevertTimeout();
      reset();
      setBadgeState("idle");
    }
  }, [badgeState, clearRevertTimeout, reset, start]);

  useEffect(() => {
    if (badgeState !== "processing") return;
    if (progressValue < COMPLETION_THRESHOLD) return;

    clearRevertTimeout();
    setBadgeState("success");

    revertTimeoutRef.current = window.setTimeout(() => {
      reset();
      setBadgeState("idle");
      revertTimeoutRef.current = null;
    }, AUTO_RESET_DELAY);
  }, [badgeState, progressValue, clearRevertTimeout, reset]);

  useEffect(() => {
    return () => {
      clearRevertTimeout();
    };
  }, [clearRevertTimeout]);

  return { badgeState, progressValue, handleBadgeClick } as const;
}
