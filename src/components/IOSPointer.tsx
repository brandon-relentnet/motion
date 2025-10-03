"use client";

import { Cursor, useCursorState } from "motion-plus/react";

export default function IOSPointer() {
  const { zone } = useCursorState();

  return (
    <div className="container">
      <Cursor
        magnetic
        className={`${
          zone === "overlay" ? "mix-blend-difference" : "mix-blend-multiply"
        } rounded-[10px]`}
        variants={{
          default: {
            backgroundColor: zone === "overlay" ? "#eee" : "#7e7e7e",
          },
          pointer: {
            backgroundColor: zone === "overlay" ? "#fff" : "#ddd",
          },
        }}
      />
    </div>
  );
}
