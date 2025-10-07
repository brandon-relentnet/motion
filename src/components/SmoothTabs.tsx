"use client";

import {
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import Active from "../tabs/Active";
import Stopped from "../tabs/Stopped";
import Deploy from "../tabs/Deploy";
import Categories from "../tabs/Categories";

type SmoothTabsProps = {
  onActiveTabChange?: (tabId: string) => void;
  fullWidth?: boolean;
};

export const DEPLOY_TAB_ID = "tab-1";

export default function SmoothTabs({ onActiveTabChange }: SmoothTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const isMounted = useMounted();

  const viewsContainerRef = useRef<HTMLDivElement>(null);
  const [viewsContainerWidth, setViewsContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (viewsContainerRef.current) {
        const width = viewsContainerRef.current.getBoundingClientRect().width;
        setViewsContainerWidth(width);
      }
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, [viewsContainerWidth]);

  useEffect(() => {
    onActiveTabChange?.(activeTab);
  }, [activeTab, onActiveTabChange]);

  return (
    <div
      className={`relative container flex flex-col gap-2 justify-center items-center w-full`}
    >
      <div
        id="views-container"
        ref={viewsContainerRef}
        className="overflow-hidden relative w-full min-h-[500px] bg-base-200 p-4 rounded-box"
      >
        {isMounted &&
          tabs.map((tab, idx) => (
            <View
              key={tab.id}
              containerWidth={viewsContainerWidth}
              viewIndex={idx}
              activeIndex={tabs.findIndex((t) => t.id === activeTab)}
            >
              {(() => {
                const Component = (tab as any).component as
                  | React.ComponentType<{ tab: Tab }>
                  | undefined;
                return Component ? <Component tab={tab} /> : null;
              })()}
            </View>
          ))}
      </div>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

const View = ({
  children,
  containerWidth,
  viewIndex,
  activeIndex,
}: {
  children: React.ReactNode;
  containerWidth: number;
  viewIndex: number;
  activeIndex: number;
}) => {
  const [difference, setDifference] = useState(activeIndex - viewIndex);
  const x = useSpring(calculateViewX(difference, containerWidth), {
    stiffness: 400,
    damping: 60,
  });

  const xVelocity = useVelocity(x);

  const opacity = useTransform(
    x,
    [-containerWidth * 0.6, 0, containerWidth * 0.6],
    [0, 1, 0]
  );

  // The more the view is moving, the more blurred it is
  const blur = useTransform(xVelocity, [-1000, 0, 1000], [4, 0, 4], {
    clamp: false,
  });

  useEffect(() => {
    const newDifference = activeIndex - viewIndex;
    setDifference(newDifference);
    const newX = calculateViewX(newDifference, containerWidth);
    x.set(newX);
  }, [activeIndex, containerWidth, difference, viewIndex, x]);

  return (
    <motion.div
      style={{
        x,
        opacity,
        filter: useMotionTemplate`blur(${blur}px)`,
      }}
      className="absolute inset-0 p-2 origin-center transform-gpu will-change-transform isolate"
    >
      <div className="w-full h-full p-8 box-border flex flex-col gap-3">
        {children}
      </div>
    </motion.div>
  );
};

const Tabs = ({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string; color: string }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  return (
    <ul className="font-poppins w-fit min-w-50 flex p-0 m-0 list-none">
      {tabs.map((tab, idx) => {
        const liPaddingClass =
          idx === 0
            ? "py-1 pr-0 pl-1"
            : idx === tabs.length - 1
              ? "py-1 pr-1 pl-0"
              : "p-1";

        return (
          <motion.li
            key={tab.id}
            className={`flex flex-grow ${liPaddingClass}`}
          >
            <motion.button
              className={`relative w-full py-2 px-4 flex justify-center items-center text-[14px] card cursor-pointer`}
              whileFocus={{
                outline: "2px solid var(--accent)",
              }}
              onClick={() => onTabChange(tab.id)}
            >
              <span
                className={`z-10 transition duration-150 ${
                  activeTab === tab.id
                    ? "text-[#f5f5f5]"
                    : "text-[var(--feint-text)]"
                }`}
              >
                {tab.label}
              </span>

              {tab.id === activeTab ? (
                <motion.span
                  layoutId="activeTab"
                  id="activeTab"
                  transition={{
                    type: "spring",
                    stiffness: 600,
                    damping: 40,
                  }}
                  className={`absolute inset-0 card ${tab.color}`}
                />
              ) : null}
            </motion.button>
          </motion.li>
        );
      })}
    </ul>
  );
};

type Tab = {
  id: string;
  label: string;
  color: string;
  description?: string;
};
const tabs = [
  {
    id: DEPLOY_TAB_ID,
    label: "Deploy",
    color: "bg-primary",
    component: Deploy as React.ComponentType<{ tab: Tab }>,
  },
  {
    id: "tab-2",
    label: "Active",
    color: "bg-success",
    component: Active as React.ComponentType<{ tab: Tab }>,
  },
  {
    id: "tab-3",
    label: "Stopped",
    color: "bg-error",
    component: Stopped as React.ComponentType<{ tab: Tab }>,
  },
  {
    id: "tab-4",
    label: "+",
    color: "bg-accent",
    component: Categories as React.ComponentType<{ tab: Tab }>,
  },
];

/**
 * ==============   Utils   ================
 */
const calculateViewX = (difference: number, containerWidth: number) => {
  return difference * (containerWidth * 0.75) * -1;
};

const useMounted = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted;
};
