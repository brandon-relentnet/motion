import type { Transition } from "motion/react";

export const BADGE_STATES = {
  idle: "Start",
  processing: "Processing",
  success: "Done",
  error: "Something went wrong",
} as const;

export type BadgeState = keyof typeof BADGE_STATES;

export const BADGE_TRANSITION: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
};

export const ICON_SIZE = 20;
export const STROKE_WIDTH = 1.5;
export const VIEW_BOX_SIZE = 24;

export const ICON_DRAW_SPRING: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 20,
};

export const ICON_DRAW_ANIMATION = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: ICON_DRAW_SPRING,
};

export const SECOND_LINE_ANIMATION = {
  ...ICON_DRAW_ANIMATION,
  transition: { ...ICON_DRAW_SPRING, delay: 0.1 },
};

export const SVG_PROPS = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  viewBox: `0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: STROKE_WIDTH,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
