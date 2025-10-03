"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { BadgeState } from "./constants";
import { BADGE_STATES, BADGE_TRANSITION } from "./constants";

type BadgeLabelProps = {
  state: BadgeState;
  labels?: Record<BadgeState, string>;
};

export function BadgeLabel({ state, labels }: BadgeLabelProps) {
  const [labelWidth, setLabelWidth] = useState(0);
  const measureRef = useRef<HTMLDivElement>(null);
  const labelText = (labels ?? BADGE_STATES)[state];

  useEffect(() => {
    if (!measureRef.current) return;
    const { width } = measureRef.current.getBoundingClientRect();
    setLabelWidth(width);
  }, [labelText]);

  return (
    <>
      <div ref={measureRef} className="absolute invisible whitespace-nowrap">
        {labelText}
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
            {labelText}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    </>
  );
}
