"use client";

import { useCallback, useMemo, useState } from "react";
import { BadgeButton } from "./BadgeButton";
import type { BadgeState } from "./constants";
import { BADGE_STATES } from "./constants";
import { INITIAL_BADGE_STATE, getNextState } from "./state";

type MultiStateBadgeProps = {
  state?: BadgeState;
  defaultState?: BadgeState;
  onStateChange?: (state: BadgeState) => void;
  labels?: Partial<Record<BadgeState, string>>;
  disabled?: boolean;
  onBadgeClick?: (state: BadgeState) => void;
  cycleOnClick?: boolean;
  getNextState?: (state: BadgeState) => BadgeState;
  className?: string;
};

export function MultiStateBadge({
  state,
  defaultState = INITIAL_BADGE_STATE,
  onStateChange,
  labels,
  disabled,
  onBadgeClick,
  cycleOnClick = true,
  getNextState: resolveNextState = getNextState,
  className,
}: MultiStateBadgeProps) {
  const [internalState, setInternalState] = useState<BadgeState>(defaultState);
  const isControlled = state !== undefined;
  const currentState = isControlled ? state : internalState;

  const mergedLabels = useMemo(() => {
    if (!labels) return BADGE_STATES;
    return { ...BADGE_STATES, ...labels } as Record<BadgeState, string>;
  }, [labels]);

  const handleClick = useCallback(() => {
    onBadgeClick?.(currentState);
    if (!cycleOnClick) return;
    const next = resolveNextState(currentState);
    if (!isControlled) setInternalState(next);
    onStateChange?.(next);
  }, [cycleOnClick, currentState, isControlled, resolveNextState, onBadgeClick, onStateChange]);

  return (
    <div
      className={`flex flex-col justify-between items-center p-4 h-20 ${
        className ?? ""
      }`.trim()}
    >
      <BadgeButton
        state={currentState}
        onClick={handleClick}
        labels={mergedLabels}
        disabled={disabled}
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
