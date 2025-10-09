"use client";

import { AnimatePresence, motion, usePresenceData } from "motion/react";
import { forwardRef, useEffect, useState, type ComponentType } from "react";
import { CONTAINERS_TAB_ID, DEPLOY_TAB_ID, HISTORY_TAB_ID, type TabId } from "../constants/tabs";
import { useTabsStore } from "../stores/tabsStore";
import ContainerSettingsPanel from "../tabs/ContainerSettingsPanel";
import DeploymentForm from "./DeploymentForm";
import HistoryInsightsPanel from "./HistoryInsightsPanel";

const SLIDE_COMPONENTS: Record<TabId, ComponentType> = {
  [DEPLOY_TAB_ID]: DeploymentForm,
  [CONTAINERS_TAB_ID]: ContainerSettingsPanel,
  [HISTORY_TAB_ID]: HistoryInsightsPanel,
};

export default function UsePresenceData() {
  const activeTab = useTabsStore((state) => state.activeTab);
  const [selectedKey, setSelectedKey] = useState<TabId>(DEPLOY_TAB_ID);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const nextKey = SLIDE_COMPONENTS[activeTab] ? activeTab : DEPLOY_TAB_ID;
    setSelectedKey(nextKey);
    setDirection(1);
  }, [activeTab]);

  const Component = SLIDE_COMPONENTS[selectedKey] ?? DeploymentForm;

  return (
    <div className="relative">
      <AnimatePresence custom={direction} initial={false} mode="popLayout">
        <Slide key={selectedKey} component={Component} />
      </AnimatePresence>
    </div>
  );
}

const Slide = forwardRef(function Slide(
  {
    component: Component,
  }: {
    component: ComponentType;
  },
  ref: React.Ref<HTMLDivElement>
) {
  const direction = usePresenceData();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: direction * 200 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          delay: 0.1,
          type: "spring",
          ...SLIDE_SPRING,
        },
      }}
      exit={{ opacity: 0, y: direction * -200 }}
      className="relative card w-full"
    >
      <Component />
    </motion.div>
  );
});

const SLIDE_SPRING = {
  stiffness: 150,
  damping: 20,
};
