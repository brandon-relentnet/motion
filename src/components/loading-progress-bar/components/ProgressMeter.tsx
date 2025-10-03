"use client";

import { motion, useMotionValue } from "motion/react";
import { useEffect, useMemo } from "react";
import type { MotionValue } from "motion";

type ProgressMeterProps = {
  progress?: MotionValue<number>;
  value?: number;
  formatValue?: (value: number) => string;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  labelClassName?: string;
  ariaLabel?: string;
};

export function ProgressMeter({
  progress,
  value,
  formatValue,
  className,
  trackClassName,
  indicatorClassName,
  labelClassName,
  ariaLabel = "Progress",
}: ProgressMeterProps) {
  const fallbackMotion = useMotionValue(value ?? 0);
  const motionValue = progress ?? fallbackMotion;

  useEffect(() => {
    if (value === undefined) return;
    if (progress && motionValue === progress) return;
    motionValue.set(value);
  }, [motionValue, progress, value]);

  const displayValue = useMemo(() => {
    if (value !== undefined) return value;
    return motionValue.get();
  }, [motionValue, value]);

  const renderValue = formatValue
    ? formatValue(displayValue)
    : `${(displayValue * 100).toFixed(1)}%`;

  const rootClassName = ["flex justify-center items-center rounded flex-1", className]
    .filter(Boolean)
    .join(" ");

  const trackClasses = [
    "h-5 relative isolate rounded-xl overflow-hidden w-full bg-white/35 ring-1 ring-inset ring-white/50 shadow-inner",
    trackClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const indicatorClasses = [
    "origin-left will-change-[transform] rounded-xl h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] bg-gradient-to-r from-sky-300/80 via-indigo-300/80 to-violet-300/80 backdrop-blur-xl w-full",
    indicatorClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const labelClasses = [
    "w-16 absolute right-1/2 translate-x-1/2 top-1/2 -translate-y-1/2 text-[11px] select-none tracking-tight text-slate-800/80 opacity-50 text-xs font-semibold text-center tabular-nums",
    labelClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <div className={trackClasses} aria-label={ariaLabel}>
        <motion.div className={indicatorClasses} style={{ scaleX: motionValue }} />
        <div className={labelClasses} aria-live="polite">
          {renderValue}
        </div>
      </div>
    </div>
  );
}
