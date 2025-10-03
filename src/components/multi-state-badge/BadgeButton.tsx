"use client";

import type { BadgeState } from "./constants";
import { BadgeVisual } from "./BadgeVisual";

type BadgeButtonProps = {
  state: BadgeState;
  onClick?: () => void;
  disabledStates?: BadgeState[];
};

export function BadgeButton({ state, onClick, disabledStates }: BadgeButtonProps) {
  const disabled = disabledStates?.includes(state) ?? false;

  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onClick?.();
      }}
      disabled={disabled}
      className="bg-transparent p-0 border-0 disabled:cursor-default"
    >
      <BadgeVisual state={state} />
    </button>
  );
}
