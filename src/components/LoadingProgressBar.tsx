"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTime,
  useTransform,
} from "motion/react";
import { animate, clamp } from "motion";
import type { AnimationPlaybackControls, Transition } from "motion";
import { useEffect, useState, useRef, useCallback } from "react";

const BADGE_STATES = {
  idle: "Start",
  processing: "Cancel",
  success: "Done",
  error: "Something went wrong",
} as const;

type BadgeState = keyof typeof BADGE_STATES;

function LoadingProgressBar() {
  const { progress, start, reset } = useAdaptiveLoading();
  const [progressValue, setProgressValue] = useState(0);
  const [badgeState, setBadgeState] = useState<BadgeState>("idle");
  const revertTimeoutRef = useRef<number | null>(null);

  const clearRevertTimeout = useCallback(() => {
    if (revertTimeoutRef.current != null) {
      clearTimeout(revertTimeoutRef.current);
      revertTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = progress.on("change", (value: number) => {
      setProgressValue(value);
    });
    return unsubscribe;
  }, [progress]);

  const handleBadgeClick = useCallback(() => {
    if (badgeState === "idle") {
      clearRevertTimeout();
      reset({ animate: false });
      setBadgeState("processing");
      start();
      return;
    }

    if (badgeState === "processing") {
      clearRevertTimeout();
      reset();
      setBadgeState("idle");
    }
  }, [badgeState, clearRevertTimeout, reset, start]);

  useEffect(() => {
    if (badgeState !== "processing") return;
    if (progressValue < 0.999) return;

    clearRevertTimeout();
    setBadgeState("success");

    revertTimeoutRef.current = window.setTimeout(() => {
      reset();
      setBadgeState("idle");
      revertTimeoutRef.current = null;
    }, 1600);
  }, [badgeState, progressValue, clearRevertTimeout, reset]);

  useEffect(() => {
    return () => {
      clearRevertTimeout();
    };
  }, [clearRevertTimeout]);

  return (
    <>
      <div
        className="size-150 p-6 flex flex-col gap-4 backdrop-blur-xl bg-white/40 ring ring-white/50 outline outline-white/20 rounded-2xl shadow-xl"
        style={{
          backgroundImage:
            "radial-gradient(120% 80% at 10% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 55%)",
        }}
      >
        <div className="flex gap-4 items-center">
          <ProgressControlBadge state={badgeState} onClick={handleBadgeClick} />
        </div>

        <div className="flex justify-center items-center rounded flex-1">
          <div className="h-5 relative isolate rounded-xl overflow-hidden w-full bg-white/35 ring-1 ring-inset ring-white/50 shadow-inner">
            <motion.div
              className="origin-left will-change-[transform] rounded-xl h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] bg-gradient-to-r from-sky-300/80 via-indigo-300/80 to-violet-300/80 backdrop-blur-xl w-full"
              style={{ scaleX: progress }}
            />
            <div
              className="w-16 absolute right-1/2 translate-x-1/2 top-1/2 -translate-y-1/2 text-[11px] select-none tracking-tight text-slate-800/80 opacity-50 text-xs font-semibold text-center tabular-nums"
              aria-live="polite"
            >
              {(progressValue * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ProgressControlBadge({
  state,
  onClick,
}: {
  state: BadgeState;
  onClick: () => void;
}) {
  const isInteractive = state === "idle" || state === "processing";

  return (
    <button
      type="button"
      onClick={() => {
        if (isInteractive) onClick();
      }}
      disabled={!isInteractive}
      className="bg-transparent p-0 border-0 disabled:cursor-default"
    >
      <Badge state={state} />
    </button>
  );
}

const Badge = ({ state }: { state: BadgeState }) => {
  const badgeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!badgeRef.current) return;

    if (state === "error") {
      animate(
        badgeRef.current,
        { x: [0, -6, 6, -6, 0] },
        {
          duration: 0.3,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
          repeat: 0,
          delay: 0.1,
        }
      );
    } else if (state === "success") {
      animate(
        badgeRef.current,
        {
          scale: [1, 1.2, 1],
        },
        {
          duration: 0.3,
          ease: "easeInOut",
          times: [0, 0.5, 1],
          repeat: 0,
        }
      );
    }
  }, [state]);

  return (
    <motion.div
      ref={badgeRef}
      className={`outline outline-white/30 bg-white/50 backdrop-blur-md ring-1 ring-white/60 shadow-sm hover:bg-white/60 hover:shadow text-slate-900 flex overflow-hidden items-center justify-center py-3 px-5 rounded-2xl ${
        state === "idle" ? "gap-0" : "gap-2"
      }`}
      style={{ willChange: "transform, filter" }}
    >
      <Icon state={state} />
      <Label state={state} />
    </motion.div>
  );
};

const Icon = ({ state }: { state: BadgeState }) => {
  let IconComponent = <></>;

  switch (state) {
    case "idle":
      IconComponent = <></>;
      break;
    case "processing":
      IconComponent = <Loader />;
      break;
    case "success":
      IconComponent = <Check />;
      break;
    case "error":
      IconComponent = <X />;
      break;
  }

  return (
    <motion.span
      className="py-2 relative flex items-center justify-center"
      animate={{
        width: state === "idle" ? 0 : ICON_SIZE,
      }}
      transition={SPRING_CONFIG}
    >
      <AnimatePresence>
        <motion.span
          key={state}
          className="absolute left-0 top-0"
          initial={{
            y: -40,
            scale: 0.5,
            filter: "blur(6px)",
          }}
          animate={{
            y: 0,
            scale: 1,
            filter: "blur(0px)",
          }}
          exit={{
            y: 40,
            scale: 0.5,
            filter: "blur(6px)",
          }}
          transition={{
            duration: 0.15,
            ease: "easeInOut",
          }}
        >
          {IconComponent}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
};

const ICON_SIZE = 20;
const STROKE_WIDTH = 1.5;
const VIEW_BOX_SIZE = 24;

const svgProps = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  viewBox: `0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: STROKE_WIDTH,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const springConfig: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 20,
};

const animations = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: springConfig,
};

const secondLineAnimation = {
  ...animations,
  transition: { ...springConfig, delay: 0.1 },
};

function Check() {
  return (
    <motion.svg {...svgProps}>
      <motion.polyline points="4 12 9 17 20 6" {...animations} />
    </motion.svg>
  );
}

function Loader() {
  const time = useTime();
  const rotate = useTransform(time, [0, 1000], [0, 360], { clamp: false });

  return (
    <motion.div
      style={{
        rotate,
      }}
      className="flex items-center justify-center w-5 h-5"
    >
      <motion.svg {...svgProps}>
        <motion.path d="M21 12a9 9 0 1 1-6.219-8.56" {...animations} />
      </motion.svg>
    </motion.div>
  );
}

function X() {
  return (
    <motion.svg {...svgProps}>
      <motion.line x1="6" y1="6" x2="18" y2="18" {...animations} />
      <motion.line x1="18" y1="6" x2="6" y2="18" {...secondLineAnimation} />
    </motion.svg>
  );
}

const Label = ({ state }: { state: BadgeState }) => {
  const [labelWidth, setLabelWidth] = useState(0);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (measureRef.current) {
      const { width } = measureRef.current.getBoundingClientRect();
      setLabelWidth(width);
    }
  }, [state]);

  return (
    <>
      <div ref={measureRef} className="absolute invisible whitespace-nowrap">
        {BADGE_STATES[state]}
      </div>

      <motion.span
        layout
        className="relative"
        animate={{
          width: labelWidth,
        }}
        transition={SPRING_CONFIG}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={state}
            className="whitespace-nowrap"
            initial={{
              y: -20,
              opacity: 0,
              filter: "blur(10px)",
              position: "absolute" as const,
            }}
            animate={{
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              position: "relative" as const,
            }}
            exit={{
              y: 20,
              opacity: 0,
              filter: "blur(10px)",
              position: "absolute" as const,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            {BADGE_STATES[state]}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    </>
  );
};

const SPRING_CONFIG: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
};

/**
 * ==============   Utils   ================
 * - Animate to each target with duration inversely proportional to delta.
 * - Sporadic mock "updates": mixed step sizes + random delays.
 * - Reset: ease-out from current value to 0, duration scales with distance.
 */
function useAdaptiveLoading() {
  const progress = useMotionValue(0);
  const timeoutRef = useRef<number | null>(null);
  const lastTargetRef = useRef(0);
  const animRef = useRef<AnimationPlaybackControls | null>(null);

  // Larger deltas animate faster; tiny deltas animate slower.
  const durationForDelta = (delta: number) => {
    const d = clamp(0, 1, Math.abs(delta));
    const MIN = 0.1; // fastest (big jump)
    const MAX = 0.95; // slowest (tiny nudge)
    // Slightly convex inverse response to accent tiny nudges:
    const shaped = Math.pow(d, 0.8); // 0..1 (emphasize small deltas)
    return MAX - (MAX - MIN) * shaped;
  };

  const animateTo = useCallback(
    (next: number) => {
      const current = lastTargetRef.current;
      const delta = next - current;

      animRef.current?.stop();
      const controls = animate(progress, next, {
        duration: durationForDelta(delta),
        ease: "linear", // constant speed per segment; speed comes from duration
      });

      animRef.current = controls;
      controls.finished.finally(() => {
        if (animRef.current === controls) {
          animRef.current = null;
        }
      });

      lastTargetRef.current = next;
    },
    [progress]
  );

  // Mixed distribution for step sizes: occasional big bursts, some medium bumps, frequent small nudges.
  const randomStep = () => {
    const r = Math.random();
    if (r < 0.08) return 0.25 + Math.random() * 0.2; // 8%: big burst (0.25–0.45)
    if (r < 0.3) return 0.06 + Math.random() * 0.12; // 22%: medium (0.06–0.18)
    return 0.004 + Math.random() * 0.03; // 70%: small (0.004–0.034)
  };

  // Random delay between ticks, with occasional longer pauses.
  const randomDelay = () => {
    const r = Math.random();
    if (r < 0.1) return 900 + Math.random() * 900; // 10%: 0.9–1.8s pause
    return 80 + Math.random() * 620; // 90%: 80–700ms
  };

  const scheduleNext = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      const current = lastTargetRef.current;
      const next = current + randomStep();

      if (next >= 1) {
        animateTo(1);
        // Stop scheduling when complete.
        timeoutRef.current && clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        return;
      }

      animateTo(next);
      scheduleNext(); // queue next sporadic tick
    }, randomDelay());
  }, [animateTo]);

  const start = useCallback(() => {
    if (timeoutRef.current != null) return;
    scheduleNext();
  }, [scheduleNext]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      animRef.current?.stop();
    };
  }, []);

  const reset = useCallback(
    (options?: { animate?: boolean }) => {
      const animateBack = options?.animate ?? true;

      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const current = lastTargetRef.current;
      const stopCurrent = animRef.current;
      stopCurrent?.stop();

      if (!animateBack || current <= 0) {
        progress.set(0);
        lastTargetRef.current = 0;
        if (animRef.current === stopCurrent) {
          animRef.current = null;
        }
        return;
      }

      // Ease-out: fast at first → slow into zero.
      const dist = current; // distance to 0
      const MIN = 0.18;
      const MAX = 0.9;
      const duration = Math.min(MAX, Math.max(MIN, dist * 0.85));

      const controls = animate(progress, 0, {
        duration,
        ease: [0.05, 0.9, 0.2, 1],
      });

      animRef.current = controls;
      controls.finished.finally(() => {
        if (animRef.current === controls) {
          lastTargetRef.current = 0;
          progress.set(0);
          animRef.current = null;
        }
      });
    },
    [progress]
  );

  return { progress, start, reset };
}

export default LoadingProgressBar;
