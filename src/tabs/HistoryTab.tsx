import { useEffect, useMemo, useState } from "react";
import {
  selectHistoryError,
  selectHistoryLoading,
  selectHistoryRecords,
  useDeployHistoryStore,
} from "../stores/deployHistoryStore";
import type { HistoryEvent, DeploymentEvent, ContainerActionEvent } from "../types/deployment";

const DEPLOY_BADGE = {
  success: "badge-success",
  failed: "badge-error",
  cancelled: "badge-warning",
} as const;

const ACTION_BADGE = {
  success: "badge-success",
  failed: "badge-error",
} as const;

type SortField = "time" | "app" | "status" | "type";
type SortDirection = "asc" | "desc";

export default function HistoryTab({
  tab,
}: {
  tab: { label: string; color?: string; description?: string };
}) {
  const records = useDeployHistoryStore(selectHistoryRecords);
  const loading = useDeployHistoryStore(selectHistoryLoading);
  const error = useDeployHistoryStore(selectHistoryError);
  const fetchHistory = useDeployHistoryStore((state) => state.fetchHistory);

  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const apps = useMemo(() => {
    const names = new Set<string>();
    records.forEach((record) => {
      if (record.app) names.add(record.app);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filtered = useMemo(() => {
    let list = records;
    if (selectedApp !== "all") {
      list = list.filter((record) => record.app === selectedApp);
    }

    const sorted = list.slice().sort((a, b) => {
      const delta = compareEvents(a, b, sortField);
      return sortDirection === "asc" ? delta : -delta;
    });

    return sorted;
  }, [records, selectedApp, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    setSortField(field);
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <span className={`h-5 w-5 rounded-box ${tab.color}`} />
        <h3 className="m-0">{tab.label}</h3>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-base-content/70">
          Review deploys and container actions for your managed apps.
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-base-content/60" htmlFor="history-filter">
            App:
          </label>
          <select
            id="history-filter"
            className="select select-sm"
            value={selectedApp}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedApp(value);
              void fetchHistory(value === "all" ? undefined : { app: value });
            }}
          >
            <option value="all">All</option>
            {apps.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="font-semibold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      {loading && !records.length ? (
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <span className="loading loading-spinner loading-sm" /> Loading history…
        </div>
      ) : filtered.length ? (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <SortableHeader label="Type" sortField="type" currentField={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="App" sortField="app" currentField={sortField} direction={sortDirection} onSort={handleSort} />
                <th>Details</th>
                <SortableHeader label="Status" sortField="status" currentField={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Time" sortField="time" currentField={sortField} direction={sortDirection} onSort={handleSort} />
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <HistoryRow key={record.id} record={record} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-base-content/60">No history yet.</div>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  sortField,
  currentField,
  direction,
  onSort,
}: {
  label: string;
  sortField: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const active = currentField === sortField;
  return (
    <th>
      <button
        type="button"
        className={`btn btn-ghost btn-xs ${active ? "font-semibold" : ""}`}
        onClick={() => onSort(sortField)}
      >
        {label}
        {active && (direction === "asc" ? " ↑" : " ↓")}
      </button>
    </th>
  );
}

function HistoryRow({ record }: { record: HistoryEvent }) {
  if (record.kind === "deployment") {
    return <DeploymentRow record={record} />;
  }
  return <ActionRow record={record} />;
}

function DeploymentRow({ record }: { record: DeploymentEvent }) {
  return (
    <tr>
      <td>
        <span className="badge badge-outline">Deploy</span>
      </td>
      <td className="whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-medium">{record.app}</span>
          <span className="text-xs text-base-content/50">{record.container}</span>
        </div>
      </td>
      <td className="text-sm text-base-content/70">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-base-content/60">Repo</span>
          <a href={record.repoUrl} target="_blank" rel="noreferrer" className="link link-hover text-sm">
            {record.repoUrl}
          </a>
          <span className="text-xs text-base-content/60">Commit</span>
          <span className="text-sm">
            {record.commit ? <code>{record.commit.slice(0, 7)}</code> : <span className="text-base-content/50">—</span>}
          </span>
        </div>
      </td>
      <td>
        <span className={`badge ${DEPLOY_BADGE[record.status]}`}>{record.status}</span>
        {record.message && <span className="block text-xs text-base-content/60">{record.message}</span>}
      </td>
      <td className="text-sm text-base-content/70">{formatDate(record.startedAt)}</td>
      <td className="text-sm text-base-content/70">{formatDuration(record.durationMs)}</td>
    </tr>
  );
}

function ActionRow({ record }: { record: ContainerActionEvent }) {
  return (
    <tr>
      <td>
        <span className="badge badge-outline">Action</span>
      </td>
      <td className="whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-medium">{record.app}</span>
          <span className="text-xs text-base-content/50">{record.container}</span>
        </div>
      </td>
      <td className="text-sm text-base-content/70">
        <span className="badge badge-ghost capitalize">{record.action}</span>
        {record.message && <span className="block text-xs text-base-content/60">{record.message}</span>}
      </td>
      <td>
        <span className={`badge ${ACTION_BADGE[record.status]}`}>{record.status}</span>
      </td>
      <td className="text-sm text-base-content/70">{formatDate(record.timestamp)}</td>
      <td className="text-sm text-base-content/50">—</td>
    </tr>
  );
}

function compareEvents(a: HistoryEvent, b: HistoryEvent, field: SortField) {
  switch (field) {
    case "type":
      return eventTypeValue(a) - eventTypeValue(b);
    case "app":
      return a.app.localeCompare(b.app);
    case "status":
      return statusValue(a) - statusValue(b);
    case "time":
    default:
      return eventTimestamp(a).getTime() - eventTimestamp(b).getTime();
  }
}

function statusValue(event: HistoryEvent) {
  if (event.kind === "deployment") {
    return event.status === "success" ? 0 : event.status === "cancelled" ? 1 : 2;
  }
  return event.status === "success" ? 0 : 1;
}

function eventTypeValue(event: HistoryEvent) {
  return event.kind === "deployment" ? 0 : 1;
}

function eventTimestamp(event: HistoryEvent) {
  if (event.kind === "deployment") {
    return new Date(event.startedAt);
  }
  return new Date(event.timestamp);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms)) return "–";
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}
