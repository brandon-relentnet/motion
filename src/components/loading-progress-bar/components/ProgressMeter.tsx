"use client";

import { motion } from "motion/react";
import type { MotionValue } from "motion";

type ProgressMeterProps = {
  progress: MotionValue<number>;
  value: number;
};

export function ProgressMeter({ progress, value }: ProgressMeterProps) {
  return (
    <div className="flex justify-center items-center rounded flex-1">
      <div className="h-5 relative isolate rounded-xl overflow-hidden w-full bg-white/35 ring-1 ring-inset ring-white/50 shadow-inner">
        <motion.div
          className="origin-left will-change-[transform] rounded-xl h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] bg-gradient-to-r from-sky-300/80 via-indigo-300/80 to-violet-300/80 backdrop-blur-xl w-full"
          style={{ scaleX: progress }}
        />
        <div
          className="w-16 absolute right-1/2 translate-x-1/2 top-1/2 -translate-y-1/2 text-[11px] select-none tracking-tight text-slate-800/80 opacity-50 text-xs font-semibold text-center tabular-nums"
          aria-live="polite"
        >
          {(value * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
