"use client";

import { animate, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { BadgeState } from "./constants";
import { BADGE_STATES, BADGE_TRANSITION } from "./constants";
import { BadgeIcon } from "./BadgeIcon";
import { BadgeLabel } from "./BadgeLabel";

type BadgeVisualProps = {
  state: BadgeState;
  labels?: Record<BadgeState, string>;
  className?: string;
};

export function BadgeVisual({ state, labels, className }: BadgeVisualProps) {
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const labelMap = labels ?? BADGE_STATES;

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

  const baseClasses =
    "bg-gray-100 text-gray-800 flex overflow-hidden items-center justify-center py-3 px-5 rounded-full";
  const gapClass = state === "idle" ? "gap-0" : "gap-2";

  return (
    <motion.div
      ref={badgeRef}
      className={[baseClasses, gapClass, className].filter(Boolean).join(" ")}
      style={{ willChange: "transform, filter" }}
      transition={BADGE_TRANSITION}
    >
      <BadgeIcon state={state} />

      <BadgeLabel state={state} labels={labelMap} />
    </motion.div>
  );
}
