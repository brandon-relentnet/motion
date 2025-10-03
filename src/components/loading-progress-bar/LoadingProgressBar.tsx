import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useMotionValue } from "motion/react";
import { useAdaptiveLoading } from "./hooks/useAdaptiveLoading";
import { ProgressBadge } from "./components/ProgressBadge";
import { ProgressMeter } from "./components/ProgressMeter";
import type { BadgeState } from "../multi-state-badge";
import { PROGRESS_BADGE_LABELS } from "./constants";

type LoadingProgressBarProps = {
  simulate?: boolean;
  startAutomatically?: boolean;
  labels?: Partial<Record<BadgeState, string>>;
  className?: string;
  style?: CSSProperties;
  state?: BadgeState;
  defaultState?: BadgeState;
  onStateChange?: (state: BadgeState) => void;
  onStart?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  value?: number;
  showBadge?: boolean;
};

const COMPLETION_THRESHOLD = 0.999;
const RESET_DELAY = 1500;

function LoadingProgressBar({
  simulate = true,
  startAutomatically = true,
  labels,
  className,
  style,
  state,
  defaultState = "idle",
  onStateChange,
  onStart,
  onCancel,
  onComplete,
  onProgress,
  value,
  showBadge = true,
}: LoadingProgressBarProps) {
  const isStateControlled = state !== undefined;
  const [internalState, setInternalState] = useState<BadgeState>(defaultState);
  const badgeState = isStateControlled ? state! : internalState;

  const progress = useMotionValue(value ?? 0);
  const [progressValue, setProgressValue] = useState(value ?? 0);

  const { start: startSimulation, reset: resetSimulation } = useAdaptiveLoading({
    progress,
    autoStart: simulate && startAutomatically,
    initialValue: value ?? 0,
  });

  const revertTimeoutRef = useRef<number | null>(null);

  const mergedLabels = useMemo(() => {
    if (!labels) return PROGRESS_BADGE_LABELS;
    return { ...PROGRESS_BADGE_LABELS, ...labels } as Record<BadgeState, string>;
  }, [labels]);

  const setBadgeState = useCallback(
    (next: BadgeState) => {
      if (!isStateControlled) setInternalState(next);
      onStateChange?.(next);
    },
    [isStateControlled, onStateChange]
  );

  const clearRevertTimeout = useCallback(() => {
    if (revertTimeoutRef.current == null) return;
    clearTimeout(revertTimeoutRef.current);
    revertTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    if (value === undefined) return;
    progress.set(value);
    setProgressValue(value);
  }, [progress, value]);

  useEffect(() => {
    const unsubscribe = progress.on("change", (next) => {
      setProgressValue(next);
      onProgress?.(next);
    });
    return () => {
      unsubscribe();
    };
  }, [onProgress, progress]);

  useEffect(() => {
    return () => {
      clearRevertTimeout();
    };
  }, [clearRevertTimeout]);

  useEffect(() => {
    if (badgeState !== "processing") return;
    if (progressValue < COMPLETION_THRESHOLD) return;

    clearRevertTimeout();
    setBadgeState("success");
    onComplete?.();

    revertTimeoutRef.current = window.setTimeout(() => {
      if (simulate) resetSimulation();
      progress.set(0);
      setBadgeState("idle");
      revertTimeoutRef.current = null;
    }, RESET_DELAY);
  }, [badgeState, progressValue, clearRevertTimeout, setBadgeState, onComplete, simulate, resetSimulation, progress]);

  const handleStart = useCallback(() => {
    clearRevertTimeout();
    setBadgeState("processing");
    onStart?.();
    progress.set(0);
    if (simulate) {
      resetSimulation({ animate: false });
      startSimulation();
    }
  }, [clearRevertTimeout, progress, setBadgeState, onStart, simulate, resetSimulation, startSimulation]);

  const handleCancel = useCallback(() => {
    clearRevertTimeout();
    setBadgeState("idle");
    onCancel?.();
    if (simulate) {
      resetSimulation();
    } else {
      progress.set(0);
    }
  }, [clearRevertTimeout, setBadgeState, onCancel, simulate, resetSimulation, progress]);

  const handleBadgeClick = useCallback(() => {
    if (badgeState === "idle") {
      handleStart();
      return;
    }
    if (badgeState === "processing") {
      handleCancel();
    }
  }, [badgeState, handleCancel, handleStart]);

  const defaultContainerClasses =
    "size-150 p-6 flex flex-col gap-4 backdrop-blur-xl bg-white/40 ring ring-white/50 outline outline-white/20 rounded-2xl shadow-xl";
  const containerClasses = className
    ? `${defaultContainerClasses} ${className}`
    : defaultContainerClasses;

  return (
    <div
      className={containerClasses}
      style={{
        backgroundImage:
          "radial-gradient(120% 80% at 10% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 55%)",
        ...style,
      }}
    >
      {showBadge ? (
        <div className="flex gap-4 items-center">
          <button
            type="button"
            onClick={handleBadgeClick}
            disabled={badgeState === "success"}
            className="bg-transparent p-0 border-0 disabled:cursor-default"
          >
            <ProgressBadge state={badgeState} labels={mergedLabels} />
          </button>
        </div>
      ) : null}

      <ProgressMeter progress={progress} value={progressValue} />
    </div>
  );
}

export default LoadingProgressBar;

export { ProgressBadge } from "./components/ProgressBadge";
export { ProgressMeter } from "./components/ProgressMeter";
export { useAdaptiveLoading } from "./hooks/useAdaptiveLoading";
export {
  PROGRESS_BADGE_LABELS,
  AUTO_RESET_DELAY,
  COMPLETION_THRESHOLD,
} from "./constants";
