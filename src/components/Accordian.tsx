"use client";

import { motion, MotionConfig } from "motion/react";
import { type PropsWithChildren, useId, useState } from "react";

function Item({ header, children }: PropsWithChildren<{ header: string }>) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const id = useId();

  return (
    <MotionConfig transition={{ duration: 0.3 }}>
      <motion.section
        initial={false}
        animate={isOpen ? "open" : "closed"}
        className="rounded-field w-full relative border-1 border-base-content/20"
      >
        <h3>
          <motion.button
            id={id + "-button"}
            aria-expanded={isOpen}
            aria-controls={id}
            className="w-full flex justify-between items-center px-3 h-[38px] text-left text-[0.875rem] cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
            onFocus={onlyKeyboardFocus(() => setHasFocus(true))}
            onBlur={() => setHasFocus(false)}
          >
            <span>{header}</span> <ChevronDownIcon />
            {hasFocus && (
              <motion.div layoutId="focus-ring" className="focus-ring" />
            )}
          </motion.button>
        </h3>
        <motion.div
          variants={{
            open: {
              height: "auto",
              maskImage:
                "linear-gradient(to bottom, black 100%, transparent 100%)",
            },
            closed: {
              height: 0,
              maskImage:
                "linear-gradient(to bottom, black 50%, transparent 100%)",
            },
          }}
          id={id}
          aria-labelledby={id + "-button"}
          className="w-full overflow-hidden"
        >
          <motion.div
            variants={{
              open: {
                filter: "blur(0px)",
                opacity: 1,
              },
              closed: {
                filter: "blur(2px)",
                opacity: 0,
              },
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      </motion.section>
    </MotionConfig>
  );
}

export default function Accordion() {
  return (
    <>
      <div className="w-full flex flex-col gap-2">
        <Item header="Framework Presets">
          <div className="px-3 pb-3 pt-1">
            <textarea
              className="textarea w-full"
              placeholder="VARS=***"
            ></textarea>
          </div>
        </Item>
        <Item header="Environment Variables">
          <div className="px-3 pb-3 pt-1">
            <textarea
              className="textarea w-full"
              placeholder="VARS=***"
            ></textarea>
          </div>
        </Item>
      </div>
    </>
  );
}

/**
 * ==============   Icons   ================
 */
function ChevronDownIcon() {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={{
        open: { rotate: 180 },
        closed: { rotate: 0 },
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  );
}

/**
 * ==============   Utils   ================
 */
function onlyKeyboardFocus(callback: () => void) {
  return (e: React.FocusEvent<HTMLButtonElement>) => {
    if (e.type === "focus" && e.target.matches(":focus-visible")) {
      callback();
    }
  };
}
