"use client";

import {
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CONTAINERS_TAB_ID, DEPLOY_TAB_ID, HISTORY_TAB_ID, type TabId } from "../constants/tabs";
import { useTabsStore } from "../stores/tabsStore";
import ContainersTab from "../tabs/ContainersTab";
import Deploy from "../tabs/Deploy";
import HistoryTab from "../tabs/HistoryTab";

export default function SmoothTabs() {
  const activeTab = useTabsStore((state) => state.activeTab);
  const setActiveTab = useTabsStore((state) => state.setActiveTab);

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

  return (
    <div
      className={`relative container flex flex-col gap-2 justify-center items-center w-full`}
    >
      <div
        id="views-container"
        ref={viewsContainerRef}
        className="overflow-x-hidden relative w-full min-h-[60vh] bg-base-200 p-4 rounded-box"
      >
        {isMounted &&
          tabs.map((tab, idx) => (
            <View
              key={tab.id}
              tab={tab}
              Component={tab.component}
              containerWidth={viewsContainerWidth}
              viewIndex={idx}
              activeIndex={tabs.findIndex((t) => t.id === activeTab)}
            />
          ))}
      </div>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
      />
    </div>
  );
}

const View = ({
  Component,
  tab,
  containerWidth,
  viewIndex,
  activeIndex,
}: {
  Component: React.ComponentType<{ tab: Tab }>;
  tab: Tab;
  containerWidth: number;
  viewIndex: number;
  activeIndex: number;
}) => {
  const isActive = activeIndex === viewIndex;
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
        pointerEvents: isActive ? "auto" : "none",
        zIndex: isActive ? 1 : 0,
      }}
      className="absolute inset-0 p-2 origin-center transform-gpu will-change-transform isolate"
      aria-hidden={!isActive}
    >
      <div className="w-full overflow-hidden h-full p-8 box-border flex flex-col gap-3">
        <Component tab={tab} />
      </div>
    </motion.div>
  );
};

const Tabs = ({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
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
  id: TabId;
  label: string;
  color: string;
  description?: string;
};
type TabConfig = Tab & { component: React.ComponentType<{ tab: Tab }> };

const tabs: TabConfig[] = [
  {
    id: DEPLOY_TAB_ID,
    label: "Deploy",
    color: "bg-primary",
    component: Deploy,
  },
  {
    id: CONTAINERS_TAB_ID,
    label: "Containers",
    color: "bg-success",
    component: ContainersTab,
  },
  {
    id: HISTORY_TAB_ID,
    label: "History",
    color: "bg-info",
    component: HistoryTab,
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
