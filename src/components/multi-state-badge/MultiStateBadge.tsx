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
