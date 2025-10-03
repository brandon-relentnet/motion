"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { BadgeState } from "./constants";
import { BADGE_STATES, BADGE_TRANSITION } from "./constants";

export function BadgeLabel({ state }: { state: BadgeState }) {
  const [labelWidth, setLabelWidth] = useState(0);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!measureRef.current) return;
    const { width } = measureRef.current.getBoundingClientRect();
    setLabelWidth(width);
  }, [state]);

  return (
    <>
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
    </>
  );
}
