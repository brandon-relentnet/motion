"use client";

import {
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import DeployTab from "../tabs/Deploy";

export default function SmoothTabs() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Render Views only after mount since container width needs to be measured first
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

    // Initial measurement
    updateWidth();

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, [viewsContainerWidth]);

  return (
    <div className="relative flex flex-col gap-2 justify-center items-center min-w-[280px] w-full max-w-7xl h-full">
      <div
        id="views-container"
        ref={viewsContainerRef}
        style={{
          backgroundImage:
            "radial-gradient(120% 80% at 10% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 55%)",
        }}
        className="overflow-hidden relative w-full h-[300px] backdrop-blur-xl bg-white/40 ring ring-white/50 outline outline-white/20 rounded-2xl shadow-xl"
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
                return Component ? (
                  <Component tab={tab} />
                ) : (
                  <DummyTabContent tab={tab} />
                );
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
  // Calculate the index difference between the active tab and the current tab
  // Then use it as the factor you multiply the container width by to get the x position
  const [difference, setDifference] = useState(activeIndex - viewIndex);
  const x = useSpring(calculateViewX(difference, containerWidth), {
    stiffness: 400,
    damping: 60,
  });

  const xVelocity = useVelocity(x);

  // The closer the view is to the center, the more opaque it is
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
      <div className="w-full h-full py-8 px-9 box-border flex flex-col gap-3">
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
    <ul className="backdrop-blur-xl max-w-100 bg-white/40 ring ring-white/50 outline outline-white/20 rounded-2xl shadow-xl flex p-0 w-full m-0 list-none">
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
            className={`flex cursor-pointer flex-grow ${liPaddingClass}`}
          >
            <motion.button
              className={`relative w-full p-2 flex justify-center items-center text-[14px] rounded-[8px]`}
              whileFocus={{
                outline: "2px solid var(--accent)",
              }}
              onClick={() => onTabChange(tab.id)}
            >
              <span
                className={`z-10 ${
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
                  className="absolute inset-0 rounded-[8px]"
                  style={{ backgroundColor: tab.color }}
                />
              ) : null}
            </motion.button>
          </motion.li>
        );
      })}
    </ul>
  );
};

const DummyTabContent = ({ tab }: { tab: Tab }) => {
  return (
    <>
      <div className="flex gap-3 items-center">
        <span
          className="h-5 w-5 rounded-[16px]"
          style={{
            backgroundColor: tab.color,
          }}
        />
        <h3 className="m-0">{tab.label}</h3>
      </div>
      <p className="text-[var(--feint-text)]">{tab.description}</p>
    </>
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
    id: "tab-1",
    label: "Deploy",
    color: "#ff0088",
    component: DeployTab as React.ComponentType<{ tab: Tab }>,
  },
  {
    id: "tab-2",
    label: "DMs",
    color: "#dd00ee",
    description: "This is your DMs tab, where you can see all your recent DMs",
  },
  {
    id: "tab-3",
    label: "Activity",
    color: "#9911ff",
    description:
      "This is your Activity tab, where you can see all your recent activity",
  },
  {
    id: "tab-4",
    label: "More",
    color: "#0d63f8",
    description:
      "This is your More tab, where you can find a bunch of other stuff, like settings, help, etc.",
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
