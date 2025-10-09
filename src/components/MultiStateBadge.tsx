"use client";

import {
  animate,
  AnimatePresence,
  motion,
  type Transition,
  useTime,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLoadingStore } from "../useLoadingStore";

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

const SPRING_CONFIG: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
};

const STATES = {
  idle: "Start",
  processing: "Processing",
  success: "Done",
  cancelled: "Cancelled",
} as const;

type BadgeState = keyof typeof STATES;

type MultiStateBadgeProps = {
  onStart?: () => void;
  onReset?: () => void;
};

export default function MultiStateBadge({
  onStart,
  onReset,
}: MultiStateBadgeProps = {}) {
  const badge = useLoadingStore((state) => state.badge);

  const handleClick = () => {
    if (badge === "idle") {
      onStart?.();
    } else {
      onReset?.();
    }
  };

  return (
    <button type="button" onClick={handleClick}>
      <Badge state={badge} />
    </button>
  );
}

function Badge({ state }: { state: BadgeState }) {
  const badgeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!badgeRef.current) return;
    if (state === "success" || state === "cancelled") {
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
    <div className="flex">
      <motion.div
        ref={badgeRef}
        className={`transition-colors btn btn-primary font-medium duration-150 cursor-pointer font-poppins flex overflow-hidden items-center justify-center ${gapClass}`}
        style={{ willChange: "transform, filter" }}
      >
        <Icon state={state} />
        <Label state={state} />
      </motion.div>
    </div>
  );
}

function Icon({ state }: { state: BadgeState }) {
  let IconComponent = <></>;
  if (state === "processing") IconComponent = <Loader />;
  if (state === "success") IconComponent = <Check />;
  if (state === "cancelled") IconComponent = <Stop />;

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
}

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

function Stop() {
  return (
    <motion.svg {...svgProps}>
      <motion.rect x="7" y="7" width="10" height="10" rx="2" {...animations} />
    </motion.svg>
  );
}

function Label({ state }: { state: BadgeState }) {
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
}
