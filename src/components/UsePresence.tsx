"use client";

import { AnimatePresence, motion, usePresenceData } from "motion/react";
import { forwardRef, useEffect, useState, type ComponentType } from "react";
import DeploymentForm from "./DeploymentForm";
import EditForm from "./EditForm";
import CategoriesForm from "./CategoriesForm";

const SLIDE_COMPONENTS: Record<string, ComponentType> = {
  "tab-1": DeploymentForm,
  "tab-2": EditForm,
  "tab-3": CategoriesForm,
  "tab-4": CategoriesForm,
};

export default function UsePresenceData({ activeTab }: { activeTab: string }) {
  const [selectedKey, setSelectedKey] = useState<string>("tab-1");
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const nextKey = SLIDE_COMPONENTS[activeTab] ? activeTab : "tab-1";
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
      className="relative card w/full"
    >
      <Component />
    </motion.div>
  );
});

const SLIDE_SPRING = {
  stiffness: 150,
  damping: 20,
};
