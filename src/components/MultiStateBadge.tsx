"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useTime,
  useTransform,
} from "motion/react";
import type { Transition } from "motion/react";
import { useEffect, useRef, useState } from "react";

export default function MultiStateBadge() {
  const [badgeState, setBadgeState] = useState<keyof typeof STATES>("idle");

  return (
    <div className="flex flex-col justify-between items-center p-4 h-20">
      <button
        onClick={() => {
          setBadgeState(getNextState(badgeState));
        }}
        className="bg-transparent p-0 border-0"
      >
        <Badge state={badgeState} />
      </button>
    </div>
  );
}

const Badge = ({ state }: { state: keyof typeof STATES }) => {
  const badgeRef = useRef(null);

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
      className={`bg-gray-100 text-[#0f1115] flex overflow-hidden items-center justify-center py-3 px-5 rounded-full ${
        state === "idle" ? "gap-0" : "gap-2"
      }`}
      style={{ willChange: "transform, filter" }}
    >
      <Icon state={state} />
      <Label state={state} />
    </motion.div>
  );
};

/**
 * ==============   Icons   ================
 */
const Icon = ({ state }: { state: keyof typeof STATES }) => {
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
      className="h-5 relative flex items-center justify-center"
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

const Label = ({ state }: { state: keyof typeof STATES }) => {
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
      {/* Hidden copy of label to measure width */}
      <div ref={measureRef} className="absolute invisible whitespace-nowrap">
        {STATES[state]}
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
            {STATES[state]}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    </>
  );
};

/**
 * ==============   Utils   ================
 */
const STATES = {
  idle: "Start",
  processing: "Processing",
  success: "Done",
  error: "Something went wrong",
} as const;

const getNextState = (state: keyof typeof STATES) => {
  const states = Object.keys(STATES) as (keyof typeof STATES)[];
  const nextIndex = (states.indexOf(state) + 1) % states.length;
  return states[nextIndex];
};

const SPRING_CONFIG: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
};
