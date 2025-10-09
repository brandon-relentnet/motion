import { useEffect, useMemo, useState } from "react";
import {
  selectHistoryError,
  selectHistoryLoading,
  selectHistoryRecords,
  useDeployHistoryStore,
} from "../stores/deployHistoryStore";
import type { DeploymentRecord } from "../types/deployment";

const STATUS_BADGE: Record<DeploymentRecord["status"], string> = {
  success: "badge-success",
  failed: "badge-error",
  cancelled: "badge-warning",
};

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

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const apps = useMemo(() => {
    const names = new Set<string>();
    records.forEach((record) => names.add(record.app));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filtered = useMemo(() => {
    if (selectedApp === "all") return records;
    return records.filter((record) => record.app === selectedApp);
  }, [records, selectedApp]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <span className={`h-5 w-5 rounded-box ${tab.color}`} />
        <h3 className="m-0">{tab.label}</h3>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-base-content/70">
          Review previous deployments and their outcome.
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
          <span className="loading loading-spinner loading-sm" /> Loading deployments…
        </div>
      ) : filtered.length ? (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>App</th>
                <th>Status</th>
                <th>Commit</th>
                <th>Branch</th>
                <th>Started</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium">{record.app}</span>
                      <span className="text-xs text-base-content/50">
                        {record.container}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[record.status]}`}>
                      {record.status}
                    </span>
                    {record.message && (
                      <span className="block text-xs text-base-content/60">
                        {record.message}
                      </span>
                    )}
                  </td>
                  <td className="text-sm text-base-content/70">
                    {record.commit ? (
                      <code>{record.commit.slice(0, 7)}</code>
                    ) : (
                      <span className="text-base-content/50">—</span>
                    )}
                  </td>
                  <td className="text-sm text-base-content/70">{record.branch}</td>
                  <td className="text-sm text-base-content/70">
                    {formatDate(record.startedAt)}
                  </td>
                  <td className="text-sm text-base-content/70">
                    {formatDuration(record.durationMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-base-content/60">No deployments yet.</div>
      )}
    </div>
  );
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
