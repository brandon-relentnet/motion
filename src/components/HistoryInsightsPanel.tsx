import { useEffect, useMemo } from "react";
import {
  selectHistoryError,
  selectHistoryLoading,
  selectHistoryRecords,
  useDeployHistoryStore,
} from "../stores/deployHistoryStore";
import type { ContainerActionEvent, DeploymentEvent, HistoryEvent } from "../types/deployment";

const RECENT_LIMIT = 5;

export default function HistoryInsightsPanel() {
  const records = useDeployHistoryStore(selectHistoryRecords);
  const loading = useDeployHistoryStore(selectHistoryLoading);
  const error = useDeployHistoryStore(selectHistoryError);
  const fetchHistory = useDeployHistoryStore((state) => state.fetchHistory);

  useEffect(() => {
    if (!records.length && !loading) {
      void fetchHistory({ limit: 100 });
    }
  }, [records.length, loading, fetchHistory]);

  const summary = useMemo(() => buildSummary(records), [records]);
  const recent = useMemo(() => buildRecent(records), [records]);

  return (
    <div className="card w-full p-6 flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">Activity Overview</h3>
        <p className="text-sm text-base-content/70">
          Quick snapshot of deployments and container maintenance.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3">
        <StatCard
          label="Deployments"
          primary={summary.deployments}
          secondary={`${summary.failedDeployments} failed`}
        />
        <StatCard
          label="Container Actions"
          primary={summary.actions}
          secondary={`${summary.failedActions} failed`}
        />
        <StatCard
          label="Last Event"
          primary={summary.lastEventLabel}
          secondary={summary.lastEventTime ?? "No events yet"}
        />
      </section>

      {error && (
        <div className="alert alert-error">
          <span className="font-semibold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
            Recent activity
          </h4>
          {loading && (
            <span className="text-xs text-base-content/50 flex items-center gap-2">
              <span className="loading loading-spinner loading-xs" /> Updating…
            </span>
          )}
        </div>
        {recent.length ? (
          <ul className="space-y-2">
            {recent.map((event) => (
              <li
                key={event.id}
                className="rounded-box border border-base-300/60 px-3 py-2 text-sm flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {event.kind === "deployment" ? "Deploy" : "Action"} • {event.app}
                  </span>
                  <span className={`badge ${badgeTone(event)}`}>
                    {event.kind === "deployment" ? event.status : event.action}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60">
                  <span>{formatRelative(eventTimestamp(event))}</span>
                  {event.kind === "deployment" && event.commit && (
                    <span>
                      commit <code>{event.commit.slice(0, 7)}</code>
                    </span>
                  )}
                  {event.kind === "container-action" && event.message && (
                    <span>{event.message}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-base-content/60">No recent activity yet.</p>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <div className="rounded-box border border-base-300/60 px-3 py-3 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-base-content/50">
        {label}
      </span>
      <span className="text-lg font-semibold">{primary}</span>
      {secondary && <span className="text-xs text-base-content/60">{secondary}</span>}
    </div>
  );
}

function buildSummary(records: HistoryEvent[]) {
  const deployments = records.filter((event): event is DeploymentEvent => event.kind === "deployment");
  const actions = records.filter((event): event is ContainerActionEvent => event.kind === "container-action");

  const failedDeployments = deployments.filter((event) => event.status !== "success").length;
  const failedActions = actions.filter((event) => event.status !== "success").length;

  const lastEvent = [...records]
    .sort((a, b) => eventTimestamp(b).getTime() - eventTimestamp(a).getTime())
    .at(0);

  return {
    deployments: deployments.length.toString(),
    failedDeployments: failedDeployments.toString(),
    actions: actions.length.toString(),
    failedActions: failedActions.toString(),
    lastEventLabel: lastEvent ? labelForEvent(lastEvent) : "No events",
    lastEventTime: lastEvent ? formatRelative(eventTimestamp(lastEvent)) : null,
  };
}

function buildRecent(records: HistoryEvent[]) {
  return [...records]
    .sort((a, b) => eventTimestamp(b).getTime() - eventTimestamp(a).getTime())
    .slice(0, RECENT_LIMIT);
}

function labelForEvent(event: HistoryEvent) {
  if (event.kind === "deployment") {
    return `${event.app} • ${event.status}`;
  }
  return `${event.app} • ${event.action}`;
}

function eventTimestamp(event: HistoryEvent) {
  if (event.kind === "deployment") {
    return new Date(event.completedAt ?? event.startedAt);
  }
  return new Date(event.timestamp);
}

function formatRelative(date: Date) {
  const now = Date.now();
  const delta = now - date.getTime();
  if (!Number.isFinite(delta)) return "?";
  const seconds = Math.max(0, Math.round(delta / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function badgeTone(event: HistoryEvent) {
  if (event.kind === "deployment") {
    return event.status === "success" ? "badge-success" : "badge-error";
  }
  return event.status === "success" ? "badge-ghost" : "badge-error";
}
