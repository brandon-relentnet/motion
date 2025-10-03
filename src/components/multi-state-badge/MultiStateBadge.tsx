"use client";

import { useState } from "react";
import type { BadgeState } from "./constants";
import { BadgeVisual } from "./BadgeVisual";
import { INITIAL_BADGE_STATE, getNextState } from "./state";

export function MultiStateBadge() {
  const [state, setState] = useState<BadgeState>(INITIAL_BADGE_STATE);

  return (
    <div className="flex flex-col justify-between items-center p-4 h-20">
      <button
        type="button"
        onClick={() => {
          setState(getNextState(state));
        }}
        className="bg-transparent p-0 border-0"
      >
        <BadgeVisual state={state} />
      </button>
    </div>
  );
}
