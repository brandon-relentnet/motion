"use client";

import type { BadgeState } from "./constants";
import { BadgeVisual } from "./BadgeVisual";

type BadgeButtonProps = {
  state: BadgeState;
  onClick?: (nextState: BadgeState) => void;
  disabled?: boolean;
  labels?: Record<BadgeState, string>;
  className?: string;
};

export function BadgeButton({
  state,
  onClick,
  disabled,
  labels,
  className,
}: BadgeButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onClick?.(state);
      }}
      disabled={disabled}
      className={`bg-transparent p-0 border-0 disabled:cursor-default ${
        className ?? ""
      }`.trim()}
    >
      <BadgeVisual state={state} labels={labels} />
    </button>
  );
}
