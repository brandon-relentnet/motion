import type { BadgeState } from "../multi-state-badge";

export const PROGRESS_BADGE_LABELS: Record<BadgeState, string> = {
  idle: "Start",
  processing: "Cancel",
  success: "Done",
  error: "Something went wrong",
};

export const COMPLETION_THRESHOLD = 0.999;
export const AUTO_RESET_DELAY = 1600;
