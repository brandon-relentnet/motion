import { useEffect, useMemo } from "react";
import {
  useContainersStore,
  selectApps,
  selectError,
  selectLoading,
} from "../stores/containersStore";
import type { AppInfo, ContainerState } from "../types/app";

type ContainersProps = {
  filter?: "running" | "stopped" | "all";
};

export default function Containers({ filter = "all" }: ContainersProps) {
  const apps = useContainersStore(selectApps);
  const loading = useContainersStore(selectLoading);
  const error = useContainersStore(selectError);
  const fetchApps = useContainersStore((state) => state.fetchApps);

  useEffect(() => {
    if (!apps.length) {
      void fetchApps();
    }
  }, [apps.length, fetchApps]);

  const filteredApps = useMemo(() => {
    if (filter === "all") return apps;
    if (filter === "running") {
      return apps.filter((app) => app.state === "running");
    }
    return apps.filter((app) => app.state === "exited");
  }, [apps, filter]);

  return (
    <div className="flex flex-col gap-4">
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
          <table className="table table-zebra">
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
                <ContainerRow key={app.container} app={app} />
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

function ContainerRow({ app }: { app: AppInfo }) {
  const runAction = useContainersStore((state) => state.runAction);
  const pending = useContainersStore(
    (state) => state.pendingActions[app.container] ?? null
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

  const statusClass = statusBadge(app.state);

  return (
    <tr>
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
              Open site
            </a>
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
          {renderActionButtons({ pending, appState: app.state, onAction: handleAction })}
        </div>
      </td>
    </tr>
  );
}

function renderActionButtons({
  pending,
  appState,
  onAction,
}: {
  pending: string | null;
  appState: ContainerState;
  onAction: (
    action: "start" | "stop" | "restart" | "remove",
    options?: { purge?: boolean }
  ) => void;
}) {
  const isBusy = Boolean(pending);
  const makeHandler = (
    action: "start" | "stop" | "restart" | "remove",
    options?: { purge?: boolean }
  ) => () => onAction(action, options);

  return (
    <>
      <button
        className="btn btn-xs"
        disabled={isBusy || appState === "running"}
        onClick={makeHandler("start")}
      >
        {pending === "start" ? <Spinner /> : "Start"}
      </button>
      <button
        className="btn btn-xs"
        disabled={isBusy || appState === "exited"}
        onClick={makeHandler("stop")}
      >
        {pending === "stop" ? <Spinner /> : "Stop"}
      </button>
      <button
        className="btn btn-xs"
        disabled={isBusy}
        onClick={makeHandler("restart")}
      >
        {pending === "restart" ? <Spinner /> : "Restart"}
      </button>
      <button
        className="btn btn-xs btn-error"
        disabled={isBusy}
        onClick={makeHandler("remove")}
      >
        {pending === "remove" ? <Spinner /> : "Remove"}
      </button>
      <button
        className="btn btn-xs btn-outline btn-error"
        disabled={isBusy}
        onClick={makeHandler("remove", { purge: true })}
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
