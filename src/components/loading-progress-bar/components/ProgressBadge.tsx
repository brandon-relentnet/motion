"use client";

import { AnimatePresence, motion } from "motion/react";
import { animate } from "motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeIcon,
  BADGE_TRANSITION,
  type BadgeState,
} from "../../multi-state-badge";
import { PROGRESS_BADGE_LABELS } from "../constants";

type ProgressBadgeProps = {
  state: BadgeState;
  labels?: Partial<Record<BadgeState, string>>;
  className?: string;
};

export function ProgressBadge({
  state,
  labels,
  className,
}: ProgressBadgeProps) {
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const [labelWidth, setLabelWidth] = useState(0);
  const measureRef = useRef<HTMLDivElement>(null);
  const resolvedLabels = useMemo(
    () =>
      ({ ...PROGRESS_BADGE_LABELS, ...labels } as Record<BadgeState, string>),
    [labels]
  );

  useEffect(() => {
    if (!badgeRef.current) return;

    if (state === "error") {
      animate(
        badgeRef.current,
        { x: [0, -6, 6, -6, 0] },
        {
          duration: 0.3,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
          repeat: 0,
          delay: 0.1,
        }
      );
    }

    if (state === "success") {
      animate(
        badgeRef.current,
        { scale: [1, 1.2, 1] },
        {
          duration: 0.3,
          ease: "easeInOut",
          times: [0, 0.5, 1],
          repeat: 0,
        }
      );
    }
  }, [state]);

  useEffect(() => {
    if (!measureRef.current) return;
    const { width } = measureRef.current.getBoundingClientRect();
    setLabelWidth(width);
  }, [resolvedLabels, state]);

  const baseClasses =
    "outline outline-white/30 bg-white/50 backdrop-blur-md ring-1 ring-white/60 shadow-sm hover:bg-white/60 hover:shadow text-slate-900 flex overflow-hidden items-center justify-center py-3 px-5 rounded-2xl";
  const gapClass = state === "idle" ? "gap-0" : "gap-2";
  const combinedClassName = [baseClasses, gapClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      ref={badgeRef}
      className={combinedClassName}
      style={{ willChange: "transform, filter" }}
      transition={BADGE_TRANSITION}
    >
      <BadgeIcon state={state} />
      <div ref={measureRef} className="absolute invisible whitespace-nowrap">
        {resolvedLabels[state]}
      </div>

      <motion.span
        layout
        className="relative"
        animate={{ width: labelWidth }}
        transition={BADGE_TRANSITION}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={state}
            className="whitespace-nowrap font-semibold"
            initial={{
              y: -20,
              opacity: 0,
              filter: "blur(10px)",
              position: "absolute" as const,
            }}
            animate={{
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              position: "relative" as const,
            }}
            exit={{
              y: 20,
              opacity: 0,
              filter: "blur(10px)",
              position: "absolute" as const,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {resolvedLabels[state]}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    </motion.div>
  );
}
