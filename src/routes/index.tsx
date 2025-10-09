import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import SmoothTabs from "../components/SmoothTabs";
import UsePresenceData from "../components/UsePresence";
import { useContainersStore } from "../stores/containersStore";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const fetchApps = useContainersStore((state) => state.fetchApps);

  useEffect(() => {
    void fetchApps();
  }, [fetchApps]);

  return (
    <div className="px-8 min-h-screen flex justify-center items-center flex-col gap-4">
      <div className="lg:flex-row flex flex-col gap-8 w-full justify-center items-center max-w-[1600px]">
        <div className={`lg:w-1/3 w-full`}>
          <UsePresenceData />
        </div>

        <div className="lg:w-2/3 w-full">
          <SmoothTabs />
        </div>
      </div>
    </div>
  );
}
