"use client";

import { AnimatePresence, motion, usePresenceData } from "motion/react";
import { forwardRef, useEffect, useState } from "react";
import DeploymentForm from "./DeploymentForm";
import EditForm from "./EditForm";

const slides = [
  {
    id: 1,
    label: "DEPLOY_TAB",
    component: DeploymentForm as React.ComponentType<{}>,
  },
  {
    id: 2,
    label: "ACTIVE_TAB",
    component: EditForm as React.ComponentType<{}>,
  },
];

export default function UsePresenceData({ activeTab }: { activeTab: string }) {
  const [selectedItem, setSelectedItem] = useState(slides[0]);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (activeTab === "tab-1") {
      setSelectedItem(slides[0]);
      setDirection(1);
    } else {
      setSelectedItem(slides[1]);
      setDirection(-1);
    }
  }, [activeTab]);

  return (
    <div className="relative">
      <AnimatePresence custom={direction} initial={false} mode="popLayout">
        <Slide key={selectedItem.id} component={selectedItem.component} />
      </AnimatePresence>
    </div>
  );
}

const Slide = forwardRef(function Slide(
  {
    component: Component,
  }: {
    component: React.ComponentType<{}>;
  },
  ref: React.Ref<HTMLDivElement>
) {
  const direction = usePresenceData();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: direction * 50 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          ...SLIDE_SPRING,
        },
      }}
      exit={{ opacity: 0, y: direction * -50 }}
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
