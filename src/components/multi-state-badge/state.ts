import type { BadgeState } from "./constants";
import { BADGE_STATES } from "./constants";

export const INITIAL_BADGE_STATE: BadgeState = "idle";

const orderedStates = Object.keys(BADGE_STATES) as BadgeState[];

export function getNextState(current: BadgeState): BadgeState {
  const nextIndex = (orderedStates.indexOf(current) + 1) % orderedStates.length;
  return orderedStates[nextIndex];
}
