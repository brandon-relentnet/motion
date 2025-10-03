"use client";

import { animate, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { BadgeState } from "./constants";
import { BadgeIcon } from "./BadgeIcon";
import { BadgeLabel } from "./BadgeLabel";

export function BadgeVisual({ state }: { state: BadgeState }) {
  const badgeRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <motion.div
      ref={badgeRef}
      className={`bg-gray-100 text-[#0f1115] flex overflow-hidden items-center justify-center py-3 px-5 rounded-full ${
        state === "idle" ? "gap-0" : "gap-2"
      }`}
      style={{ willChange: "transform, filter" }}
    >
      <BadgeIcon state={state} />
      <BadgeLabel state={state} />
    </motion.div>
  );
}
