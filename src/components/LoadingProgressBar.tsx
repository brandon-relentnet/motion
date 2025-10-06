"use client";

import { motion, useSpring } from "motion/react";
import { useEffect } from "react";
import { useLoadingStore } from "../useLoadingStore";

const PROGRESS_SPRING = {
  stiffness: 150,
  damping: 20,
};

export default function LoadingProgressBar() {
  const { progress: targetProgress } = useLoadingStore();
  const progress = useSpring(0, PROGRESS_SPRING);

  useEffect(() => {
    progress.set(targetProgress);
  }, [progress, targetProgress]);

  useEffect(() => () => useLoadingStore.getState().reset(), []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-5 relative rounded-xl overflow-hidden w-full bg-white/50">
        <motion.div
          className="origin-left h-full bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 w-full"
          style={{ scaleX: progress }}
        />
      </div>
    </div>
  );
}
