"use client";

import {
  animate,
  AnimatePresence,
  motion,
  type Transition,
  useTime,
  useTransform,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLoadingStore } from "../useLoadingStore";

export default function MultiStateBadge() {
  const { progress: p, badge, start, reset } = useLoadingStore();
  const progress = useSpring(0, { stiffness: 150, damping: 20 });

  // Animate the bar toward store progress
  useEffect(() => {
    progress.set(p);
  }, [p, progress]);

  // Click behavior (exactly as you described)
  const handleClick = () => {
    if (badge === "idle") start();
    else if (badge === "processing") reset();
    else if (badge === "success") reset();
  };

  // Optional safety: clear any running timer if this component unmounts
  useEffect(() => () => useLoadingStore.getState().reset(), []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-5 relative rounded-xl overflow-hidden w-full bg-white/50">
        <motion.div
          className="origin-left h-full bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 w-full"
          style={{ scaleX: progress }}
        />
      </div>

      <button onClick={handleClick}>
        <Badge state={badge} />
      </button>
    </div>
  );
}

/* ===== Badge (unchanged except it now receives store-driven state) ===== */

const Badge = ({ state }: { state: "idle" | "processing" | "success" }) => {
  const badgeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!badgeRef.current) return;
    if (state === "success") {
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

  const gapClass = state === "idle" ? "gap-0" : "gap-2";

  return (
    <motion.div
      ref={badgeRef}
      className={`transition-colors duration-150 bg-gradient-to-br from-sky-300/40 via-indigo-300/40 to-violet-300/40 hover:bg-gradient-to-br hover:from-sky-300/30 hover:via-indigo-300/30 hover:to-violet-300/30 cursor-pointer backdrop-blur-2xl text-slate-900 font-poppins flex overflow-hidden items-center justify-center py-3 px-5 rounded-xl shadow-sm ${gapClass}`}
      style={{ willChange: "transform, filter" }}
    >
      <Icon state={state} />
      <Label state={state} />
    </motion.div>
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

const Icon = ({ state }: { state: "idle" | "processing" | "success" }) => {
  let IconComponent = <></>;
  if (state === "processing") IconComponent = <Loader />;
  if (state === "success") IconComponent = <Check />;

  return (
    <motion.span
      className="relative flex items-center justify-center h-5"
      animate={{ width: state === "idle" ? 0 : 20 }}
      transition={SPRING_CONFIG}
    >
      <AnimatePresence>
        <motion.span
          key={state}
          className="absolute left-0 top-0"
          initial={{ y: -40, scale: 0.5, filter: "blur(6px)" }}
          animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ y: 40, scale: 0.5, filter: "blur(6px)" }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {IconComponent}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: ICON_SIZE,
        height: ICON_SIZE,
      }}
    >
      <motion.svg {...svgProps}>
        <motion.path d="M21 12a9 9 0 1 1-6.219-8.56" {...animations} />
      </motion.svg>
    </motion.div>
  );
}

const Label = ({ state }: { state: "idle" | "processing" | "success" }) => {
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
      <div
        ref={measureRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {STATES[state]}
      </div>

      <motion.span
        layout
        style={{
          position: "relative",
        }}
        animate={{
          width: labelWidth,
        }}
        transition={SPRING_CONFIG}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={state}
            style={{
              textWrap: "nowrap",
            }}
            initial={{
              y: -20,
              opacity: 0,
              filter: "blur(10px)",
              position: "absolute",
            }}
            animate={{
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              position: "relative",
            }}
            exit={{
              y: 20,
              opacity: 0,
              filter: "blur(10px)",
              position: "absolute",
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            {STATES[state]}
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

const STATES = {
  idle: "Start",
  processing: "Processing",
  success: "Done",
} as const;
