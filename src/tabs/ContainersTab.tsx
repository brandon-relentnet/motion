import { useState } from "react";
import Containers from "../components/Containers";

type ContainersFilter = "all" | "running" | "stopped";

const FILTERS: { label: string; value: ContainersFilter }[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "running" },
  { label: "Stopped", value: "stopped" },
];

export default function ContainersTab({
  tab,
}: {
  tab: { label: string; color?: string; description?: string };
}) {
  const [filter, setFilter] = useState<ContainersFilter>("running");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <span className={`h-5 w-5 rounded-box ${tab.color}`} />
        <h3 className="m-0">{tab.label}</h3>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-base-content/70">
          View and control your deployed containers.
        </p>
        <div className="btn-group">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              className={`btn btn-sm ${filter === value ? "btn-active" : "btn-ghost"}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Containers filter={filter} showHeader={false} />
    </div>
  );
}
