"use client";

import { useState } from "react";
import { BadgeButton } from "./BadgeButton";
import type { BadgeState } from "./constants";
import { INITIAL_BADGE_STATE, getNextState } from "./state";

export function MultiStateBadge() {
  const [state, setState] = useState<BadgeState>(INITIAL_BADGE_STATE);

  return (
    <div className="flex flex-col justify-between items-center p-4 h-20">
      <BadgeButton
        state={state}
        onClick={() => {
          setState(getNextState(state));
        }}
      />
    </div>
  );
}

export default MultiStateBadge;

export { BadgeButton } from "./BadgeButton";
export { BadgeVisual } from "./BadgeVisual";
export { BadgeIcon } from "./BadgeIcon";
export { BadgeLabel } from "./BadgeLabel";
export {
  BADGE_STATES,
  BADGE_TRANSITION,
  ICON_DRAW_ANIMATION,
  SECOND_LINE_ANIMATION,
  SVG_PROPS,
} from "./constants";
export type { BadgeState } from "./constants";
export { INITIAL_BADGE_STATE, getNextState } from "./state";
