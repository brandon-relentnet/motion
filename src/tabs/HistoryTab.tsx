import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: "All events", value: "all" },
  { label: "Deployments", value: "deployment" },
  { label: "Container actions", value: "action" },
];

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "Any status", value: "all" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: "Any time", value: "all" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
];

type SortField = "time" | "app" | "status" | "type";
type SortDirection = "asc" | "desc";
type TypeFilter = "all" | "deployment" | "action";
type StatusFilter = "all" | "success" | "failed" | "cancelled";
type DateFilter = "all" | "24h" | "7d" | "30d";

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const feedbackTimeout = useRef<number | null>(null);

  const announceFeedback = useCallback((message: string) => {
    setShareFeedback(message);
    if (feedbackTimeout.current) {
      window.clearTimeout(feedbackTimeout.current);
    }
    feedbackTimeout.current = window.setTimeout(() => {
      setShareFeedback(null);
      feedbackTimeout.current = null;
    }, 2200);
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) {
        window.clearTimeout(feedbackTimeout.current);
      }
    };
  }, []);

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

    if (typeFilter !== "all") {
      list = list.filter((record) =>
        typeFilter === "deployment" ? record.kind === "deployment" : record.kind === "container-action"
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((record) => matchesStatusFilter(record, statusFilter));
    }

    const sinceMs = computeSinceMs(dateFilter);
    if (sinceMs !== null) {
      list = list.filter((record) => eventTimestamp(record).getTime() >= sinceMs);
    }

    const sorted = list.slice().sort((a, b) => {
      const delta = compareEvents(a, b, sortField);
      return sortDirection === "asc" ? delta : -delta;
    });

    return sorted;
  }, [records, selectedApp, typeFilter, statusFilter, dateFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    setSortField(field);
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleExport = useCallback(() => {
    if (!filtered.length) {
      announceFeedback("No history to export.");
      return;
    }
    if (typeof document === "undefined") {
      announceFeedback("Export is only available in the browser.");
      return;
    }
    const csv = buildCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `history-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    announceFeedback(`Exported ${filtered.length} record${filtered.length === 1 ? "" : "s"}.`);
  }, [filtered, announceFeedback]);

  const handleCopyJson = useCallback(async () => {
    if (!filtered.length) {
      announceFeedback("No history to copy.");
      return;
    }
    const payload = JSON.stringify(filtered, null, 2);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      announceFeedback("History JSON copied to clipboard.");
    } catch (copyError) {
      console.error("Failed to copy history", copyError);
      announceFeedback("Unable to copy history; see console for details.");
    }
  }, [filtered, announceFeedback]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <span className={`h-5 w-5 rounded-box ${tab.color}`} />
        <h3 className="m-0">{tab.label}</h3>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-base-content/70">
            Review deploys and container actions for your managed apps.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                void fetchHistory();
                announceFeedback("History refreshed.");
              }}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleExport}
              disabled={!filtered.length}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleCopyJson}
            >
              Copy JSON
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase tracking-wide text-base-content/60" htmlFor="history-filter">
            App
          </label>
          <select
            id="history-filter"
            className="select select-sm"
            value={selectedApp}
            onChange={(event) => setSelectedApp(event.target.value)}
          >
            <option value="all">All apps</option>
            {apps.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <label className="text-xs uppercase tracking-wide text-base-content/60" htmlFor="history-type">
            Type
          </label>
          <select
            id="history-type"
            className="select select-sm"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="text-xs uppercase tracking-wide text-base-content/60" htmlFor="history-status">
            Status
          </label>
          <select
            id="history-status"
            className="select select-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="text-xs uppercase tracking-wide text-base-content/60" htmlFor="history-range">
            Range
          </label>
          <select
            id="history-range"
            className="select select-sm"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value as DateFilter)}
          >
            {DATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {shareFeedback && (
          <div className="text-xs text-success">{shareFeedback}</div>
        )}
        {!!records.length && (
          <div className="text-xs text-base-content/60">
            Showing {filtered.length} of {records.length} events
          </div>
        )}
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
        <div className="text-sm text-base-content/60">No events match the current filters.</div>
      )}
    </div>
  );
}

function computeSinceMs(range: DateFilter) {
  const now = Date.now();
  switch (range) {
    case "24h":
      return now - 24 * 60 * 60 * 1000;
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return now - 30 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

function matchesStatusFilter(event: HistoryEvent, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "cancelled") {
    return event.kind === "deployment" && event.status === "cancelled";
  }
  return event.status === filter;
}

function buildCsv(records: HistoryEvent[]) {
  const header = [
    "type",
    "app",
    "container",
    "action",
    "status",
    "timestamp",
    "durationMs",
    "repoUrl",
    "branch",
    "commit",
    "message",
  ];

  const rows = records.map((record) => {
    if (record.kind === "deployment") {
      return [
        "deployment",
        record.app,
        record.container,
        "deploy",
        record.status,
        eventTimestamp(record).toISOString(),
        String(record.durationMs ?? ""),
        record.repoUrl ?? "",
        record.branch ?? "",
        record.commit ?? "",
        record.message ?? "",
      ];
    }
    return [
      "container-action",
      record.app,
      record.container,
      record.action,
      record.status,
      eventTimestamp(record).toISOString(),
      "",
      "",
      "",
      "",
      record.message ?? "",
    ];
  });

  return [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

function csvEscape(value: string) {
  const stringValue = value ?? "";
  const needsQuotes = /[",\n]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
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
