import { useEffect, useMemo } from "react";
import {
  useContainersStore,
  selectApps,
  selectError,
  selectLoading,
  selectSelectedApp,
} from "../stores/containersStore";
import type { AppInfo, ContainerState } from "../types/app";
import { useDeploySessionStore } from "../stores/deploySessionStore";

type ContainersProps = {
  filter?: "running" | "stopped" | "all";
  showHeader?: boolean;
};

export default function Containers({
  filter = "all",
  showHeader = true,
}: ContainersProps) {
  const apps = useContainersStore(selectApps);
  const loading = useContainersStore(selectLoading);
  const error = useContainersStore(selectError);
  const fetchApps = useContainersStore((state) => state.fetchApps);
  const selectedApp = useContainersStore(selectSelectedApp);
  const setSelectedApp = useContainersStore((state) => state.setSelectedApp);

  useEffect(() => {
    if (!apps.length) {
      void fetchApps();
    }
  }, [apps.length, fetchApps]);

  useEffect(() => {
    if (selectedApp && !apps.some((app) => app.name === selectedApp)) {
      setSelectedApp(null);
    }
  }, [apps, selectedApp, setSelectedApp]);

  const filteredApps = useMemo(() => {
    if (filter === "all") return apps;
    if (filter === "running") {
      return apps.filter((app) => app.state === "running");
    }
    return apps.filter((app) => app.state === "exited");
  }, [apps, filter]);

  return (
    <div className="flex flex-col gap-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-base-content/70">
            Managing containers prefixed with your deployment namespace.
          </p>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => fetchApps()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="font-semibold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      {loading && !apps.length ? (
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <span className="loading loading-spinner loading-sm" /> Loading containers…
        </div>
      ) : filteredApps.length ? (
        <div className="overflow-x-auto">
          <table className="table table-zebra overflow-y-auto max-h-172">
            <thead>
              <tr>
                <th>App</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <ContainerRow
                  key={app.container}
                  app={app}
                  selected={selectedApp === app.name}
                  onSelect={() => setSelectedApp(app.name)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-base-content/60">No containers found.</div>
      )}
    </div>
  );
}

function ContainerRow({
  app,
  selected,
  onSelect,
}: {
  app: AppInfo;
  selected: boolean;
  onSelect: () => void;
}) {
  const runAction = useContainersStore((state) => state.runAction);
  const redeployApp = useContainersStore((state) => state.redeployApp);
  const pending = useContainersStore(
    (state) => state.pendingActions[app.container] ?? null
  );
  const sessionRunning = useDeploySessionStore((state) => state.isRunning);

  const repoLabel = useMemo(() => formatRepositoryLabel(app.repoUrl), [app.repoUrl]);
  const branchLabel = app.branch?.trim() ?? "";
  const frameworkLabel = app.framework?.trim() ?? "";
  const lastDeployRelative = useMemo(
    () => (app.lastDeployedAt ? formatRelativeTime(app.lastDeployedAt) : null),
    [app.lastDeployedAt]
  );

  const handleAction = async (
    action: "start" | "stop" | "restart" | "remove",
    options?: { purge?: boolean }
  ) => {
    try {
      await runAction(app.container, action, options);
    } catch (error) {
      console.error("Container action failed", error);
    }
  };

  const handleRedeploy = async () => {
    try {
      await redeployApp(app.name);
    } catch (error) {
      console.error("Container redeploy failed", error);
    }
  };

  const statusClass = statusBadge(app.state);

  return (
    <tr
      className={selected ? "bg-base-200" : ""}
      onClick={() => onSelect()}
      role="button"
      style={{ cursor: "pointer" }}
    >
      <td className="whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-medium">{app.name}</span>
          <span className="text-xs text-base-content/50">{app.container}</span>
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary"
            >
              {app.url}
            </a>
          )}
          {(repoLabel || branchLabel || frameworkLabel || lastDeployRelative) && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-base-content/60">
              {repoLabel && app.repoUrl ? (
                <a
                  href={app.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="badge badge-outline"
                >
                  {repoLabel}
                </a>
              ) : null}
              {branchLabel && (
                <span className="badge badge-ghost">{branchLabel}</span>
              )}
              {frameworkLabel && (
                <span className="badge badge-ghost badge-outline">
                  {frameworkLabel}
                </span>
              )}
              {lastDeployRelative && (
                <span className="badge badge-ghost" title={formatTimestamp(app.lastDeployedAt!)}>
                  {lastDeployRelative}
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td>
        <span className={`badge ${statusClass}`}>{app.state}</span>
        <span className="block text-xs text-base-content/60">{app.status}</span>
      </td>
      <td className="text-sm text-base-content/70">
        {formatTimestamp(app.updatedAt)}
      </td>
      <td>
        <div className="flex flex-wrap gap-2">
          {renderActionButtons({
            pending,
            appState: app.state,
            onAction: handleAction,
            onRedeploy: handleRedeploy,
            sessionRunning,
          })}
        </div>
      </td>
    </tr>
  );
}

function renderActionButtons({
  pending,
  appState,
  onAction,
  onRedeploy,
  sessionRunning,
}: {
  pending: string | null;
  appState: ContainerState;
  onAction: (
    action: "start" | "stop" | "restart" | "remove",
    options?: { purge?: boolean }
  ) => void;
  onRedeploy: () => void;
  sessionRunning: boolean;
}) {
  const isBusy = Boolean(pending);
  const makeHandler = (
    action: "start" | "stop" | "restart" | "remove",
    options?: { purge?: boolean }
  ) => () => onAction(action, options);

  return (
    <>
      <div className="tooltip tooltip-bottom" data-tip="Redeploy latest build">
        <button
          className="btn btn-xs btn-primary"
          disabled={isBusy || sessionRunning}
          onClick={(event) => {
            event.stopPropagation();
            onRedeploy();
          }}
        >
          {pending === "update" ? <Spinner /> : "Update"}
        </button>
      </div>
      <button
        className="btn btn-xs"
        disabled={isBusy || appState === "running"}
        onClick={(event) => {
          event.stopPropagation();
          makeHandler("start")();
        }}
      >
        {pending === "start" ? <Spinner /> : "Start"}
      </button>
      <button
        className="btn btn-xs"
        disabled={isBusy || appState === "exited"}
        onClick={(event) => {
          event.stopPropagation();
          makeHandler("stop")();
        }}
      >
        {pending === "stop" ? <Spinner /> : "Stop"}
      </button>
      <button
        className="btn btn-xs"
        disabled={isBusy}
        onClick={(event) => {
          event.stopPropagation();
          makeHandler("restart")();
        }}
      >
        {pending === "restart" ? <Spinner /> : "Restart"}
      </button>
      <button
        className="btn btn-xs btn-error"
        disabled={isBusy}
        onClick={(event) => {
          event.stopPropagation();
          makeHandler("remove")();
        }}
      >
        {pending === "remove" ? <Spinner /> : "Remove"}
      </button>
      <button
        className="btn btn-xs btn-outline btn-error"
        disabled={isBusy}
        onClick={(event) => {
          event.stopPropagation();
          makeHandler("remove", { purge: true })();
        }}
      >
        {pending === "purge" ? <Spinner /> : "Purge"}
      </button>
    </>
  );
}

function Spinner() {
  return <span className="loading loading-spinner loading-xs" />;
}

function statusBadge(state: ContainerState) {
  switch (state) {
    case "running":
      return "badge-success";
    case "restarting":
      return "badge-warning";
    default:
      return "badge-ghost";
  }
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "just now";
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatRepositoryLabel(repoUrl?: string) {
  if (!repoUrl) return "";
  try {
    const url = new URL(repoUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `${segments[segments.length - 2]}/${segments[segments.length - 1].replace(/\.git$/, "")}`;
    }
    return url.hostname;
  } catch {
    return repoUrl;
  }
}
