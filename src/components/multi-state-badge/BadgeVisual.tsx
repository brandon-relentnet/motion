"use client";

import { AnimatePresence, motion } from "motion/react";
import { animate } from "motion";
import { useEffect, useRef, useState } from "react";
import type { BadgeState } from "./constants";
import { BadgeIcon } from "./BadgeIcon";
import { BADGE_STATES, BADGE_TRANSITION } from "./constants";

export function BadgeVisual({ state }: { state: BadgeState }) {
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);

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
  }, [state]);

  return (
    <motion.div
      ref={badgeRef}
      className={`bg-gray-100 text-[#0f1115] flex overflow-hidden items-center justify-center py-3 px-5 rounded-full ${
        state === "idle" ? "gap-0" : "gap-2"
      }`}
      style={{ willChange: "transform, filter" }}
      transition={BADGE_TRANSITION}
    >
      <BadgeIcon state={state} />

      <div ref={measureRef} className="absolute invisible whitespace-nowrap">
        {BADGE_STATES[state]}
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
            className="whitespace-nowrap"
            initial={{ y: -20, opacity: 0, filter: "blur(10px)", position: "absolute" as const }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)", position: "relative" as const }}
            exit={{ y: 20, opacity: 0, filter: "blur(10px)", position: "absolute" as const }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {BADGE_STATES[state]}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    </motion.div>
  );
}
