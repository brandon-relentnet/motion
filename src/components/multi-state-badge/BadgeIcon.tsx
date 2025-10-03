"use client";

import {
  AnimatePresence,
  motion,
  useTime,
  useTransform,
} from "motion/react";
import type { BadgeState } from "./constants";
import {
  BADGE_TRANSITION,
  ICON_DRAW_ANIMATION,
  SECOND_LINE_ANIMATION,
  SVG_PROPS,
} from "./constants";

export function BadgeIcon({ state }: { state: BadgeState }) {
  let icon = <></>;

  switch (state) {
    case "processing":
      icon = <LoaderIcon />;
      break;
    case "success":
      icon = <CheckIcon />;
      break;
    case "error":
      icon = <ErrorIcon />;
      break;
    case "idle":
    default:
      icon = <></>;
  }

  return (
    <motion.span
      className="h-5 relative flex items-center justify-center"
      animate={{
        width: state === "idle" ? 0 : SVG_PROPS.width,
      }}
      transition={BADGE_TRANSITION}
    >
      <AnimatePresence>
        <motion.span
          key={state}
          className="absolute left-0 top-0"
          initial={{ y: -40, scale: 0.5, filter: "blur(6px)" }}
          animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ y: 40, scale: 0.5, filter: "blur(6px)" }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {icon}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

function CheckIcon() {
  return (
    <motion.svg {...SVG_PROPS}>
      <motion.polyline points="4 12 9 17 20 6" {...ICON_DRAW_ANIMATION} />
    </motion.svg>
  );
}

function LoaderIcon() {
  const time = useTime();
  const rotate = useTransform(time, [0, 1000], [0, 360], { clamp: false });

  return (
    <motion.div style={{ rotate }} className="flex items-center justify-center w-5 h-5">
      <motion.svg {...SVG_PROPS}>
        <motion.path d="M21 12a9 9 0 1 1-6.219-8.56" {...ICON_DRAW_ANIMATION} />
      </motion.svg>
    </motion.div>
  );
}

function ErrorIcon() {
  return (
    <motion.svg {...SVG_PROPS}>
      <motion.line x1="6" y1="6" x2="18" y2="18" {...ICON_DRAW_ANIMATION} />
      <motion.line x1="18" y1="6" x2="6" y2="18" {...SECOND_LINE_ANIMATION} />
    </motion.svg>
  );
}
