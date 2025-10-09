"use client";

import { motion, MotionConfig } from "motion/react";
import {
  type PropsWithChildren,
  type FocusEvent,
  useId,
  useMemo,
  useState,
} from "react";
import type { DeployFramework } from "../stores/deployFormStore";

type AccordionProps = {
  frameworksEnabled?: boolean;
  framework?: DeployFramework;
  onFrameworkChange?: (value: DeployFramework) => void;
  variables?: string;
  onVariablesChange?: (value: string) => void;
};

function Item({
  header,
  children,
  subheader,
}: PropsWithChildren<{ header: string; subheader?: string }>) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const id = useId();

  return (
    <MotionConfig transition={{ duration: 0.3 }}>
      <motion.section
        initial={false}
        animate={isOpen ? "open" : "closed"}
        className="rounded-field w-full relative border-base-content/20"
        style={{ borderWidth: "var(--border)" }}
      >
        <h3>
          <motion.button
            id={id + "-button"}
            type="button"
            aria-expanded={isOpen}
            aria-controls={id}
            className="w-full flex justify-between items-center px-3 h-[38px] text-left text-[0.875rem] cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
            onFocus={onlyKeyboardFocus(() => setHasFocus(true))}
            onBlur={() => setHasFocus(false)}
          >
            <span>
              {header}{" "}
              {subheader && (
                <span className="text-base-content/50 ml-1">{subheader}</span>
              )}
            </span>{" "}
            <div className="flex items-center gap-2">
              {header === "Variables" && (
                <span className="badge badge-neutral badge-xs">Optional</span>
              )}
              <ChevronDownIcon />
            </div>
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

export default function Accordion({
  frameworksEnabled = true,
  framework = "vite",
  onFrameworkChange,
  variables = "",
  onVariablesChange,
}: AccordionProps) {
  const frameworks = useMemo(
    () => [
      { id: "vite" as DeployFramework, label: "Vite" },
      { id: "nextjs" as DeployFramework, label: "Next.js" },
    ],
    []
  );

  return (
    <div className="w-full flex flex-col gap-2">
      {frameworksEnabled && (
        <Item header="Framework" subheader={framework.toUpperCase()}>
          <div className="px-3 pb-3 pt-1">
            <ul className="menu bg-base-200 rounded-box w-full">
              {frameworks.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className={`justify-start ${
                      option.id === framework ? "active" : ""
                    }`}
                    aria-pressed={option.id === framework}
                    onClick={() => onFrameworkChange?.(option.id)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Item>
      )}
      <Item header="Variables" subheader="VARS=***">
        <div className="px-3 pb-3 pt-1">
          <textarea
            className="textarea w-full"
            value={variables}
            onChange={(event) => onVariablesChange?.(event.target.value)}
            placeholder="VARS=***"
          ></textarea>
        </div>
      </Item>
    </div>
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
  return (e: FocusEvent<HTMLButtonElement>) => {
    if (e.type === "focus" && e.target.matches(":focus-visible")) {
      callback();
    }
  };
}
