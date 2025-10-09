import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useDeploySessionStore } from "../stores/deploySessionStore";
import { useDeployFormStore } from "../stores/deployFormStore";
import { DEPLOY_STEP_MARKERS } from "../lib/deployClient";

type Tab = {
  label: string;
  color?: string;
  description?: string;
};

const STEP_LABELS: Record<string, string> = {
  git: "Clone",
  build: "Build",
  publish: "Publish",
};

const ORDERED_STEPS = DEPLOY_STEP_MARKERS.map((marker) => marker.key);

export default function Deploy({ tab }: { tab: Tab }) {
  const step = useDeploySessionStore((state) => state.step);
  const log = useDeploySessionStore((state) => state.log);
  const isRunning = useDeploySessionStore((state) => state.isRunning);
  const error = useDeploySessionStore((state) => state.error);
  const lastCommit = useDeploySessionStore((state) => state.lastCommit);
  const payload = useDeploySessionStore((state) => state.payload);
  const reset = useDeploySessionStore((state) => state.reset);

  const status = useDeployFormStore((state) => state.status);
  const statusMessage = useDeployFormStore((state) => state.statusMessage);
  const lastPayload = useDeployFormStore((state) => state.lastPayload);

  const effectivePayload = payload ?? lastPayload;

  const logAreaRef = useRef<HTMLPreElement | null>(null);
  const logText = useMemo(() => log.join(""), [log]);

  useEffect(() => {
    if (!logAreaRef.current) return;
    logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
  }, [logText]);

  const stepIndex = useMemo(() => ORDERED_STEPS.indexOf(step), [step]);

  const statusTone = useMemo(() => {
    if (isRunning) return { badge: "badge-primary", label: "Deploying" };
    if (error) return { badge: "badge-error", label: "Failed" };
    if (status === "success")
      return { badge: "badge-success", label: "Complete" };
    if (status === "submitting")
      return { badge: "badge-info", label: "Starting" };
    return { badge: "badge-ghost", label: "Idle" };
  }, [error, isRunning, status]);

  const helperMessage = useMemo(() => {
    if (error) return error;
    if (statusMessage) return statusMessage;
    if (!logText) return "Kick off a deployment to stream logs in real time.";
    return null;
  }, [error, logText, statusMessage]);

  const clearLog = useCallback(() => {
    if (isRunning) return;
    reset();
  }, [isRunning, reset]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-3 items-center">
        <span className={`h-5 w-5 rounded-box ${tab.color}`} />
        <h3 className="m-0 text-xl font-semibold">{tab.label}</h3>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card bg-base-200 p-4">
          <h4 className="text-sm font-medium uppercase tracking-wide text-base-content/70 mb-2">
            Status
          </h4>
          <div className="flex items-center gap-3">
            <span className={`badge ${statusTone.badge}`}>{statusTone.label}</span>
            {lastCommit && (
              <span className="text-xs text-base-content/70">
                commit <code>{lastCommit}</code>
              </span>
            )}
          </div>
          {helperMessage && (
            <p className="mt-3 text-sm text-base-content/70">{helperMessage}</p>
          )}
        </div>

        <div className="card bg-base-200 p-4">
          <h4 className="text-sm font-medium uppercase tracking-wide text-base-content/70 mb-2">
            Deployment Details
          </h4>
          {effectivePayload ? (
            <ul className="text-sm space-y-1 text-base-content/80">
              <li>
                <span className="font-medium text-base-content">Name:</span>{" "}
                {effectivePayload.name}
              </li>
              <li>
                <span className="font-medium text-base-content">Repository:</span>{" "}
                {effectivePayload.repoUrl}
              </li>
              {effectivePayload.appPath && (
                <li>
                  <span className="font-medium text-base-content">Path:</span>{" "}
                  {effectivePayload.appPath}
                </li>
              )}
              <li>
                <span className="font-medium text-base-content">Framework:</span>{" "}
                {effectivePayload.framework.toUpperCase()}
              </li>
            </ul>
          ) : (
            <p className="text-sm text-base-content/70">
              Submit the form to populate deployment metadata.
            </p>
          )}
        </div>
      </section>

      <section className="card bg-base-200 p-4">
        <h4 className="text-sm font-medium uppercase tracking-wide text-base-content/70 mb-3">
          Steps
        </h4>
        <div className="flex flex-col gap-2">
          {ORDERED_STEPS.map((key, index) => {
            const label = STEP_LABELS[key] ?? key;
            const hasPassed = stepIndex > index || (!isRunning && stepIndex >= index);
            const isCurrent = stepIndex === index && isRunning;
            const badgeClass = hasPassed
              ? "badge badge-success"
              : isCurrent
                ? "badge badge-info"
                : "badge badge-ghost";
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-field border border-base-300/40 px-3 py-2"
              >
                <span className="text-sm font-medium text-base-content/80">
                  {index + 1}. {label}
                </span>
                <span className={badgeClass}>
                  {hasPassed ? "Done" : isCurrent ? "Running" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card bg-base-200 p-0 flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-base-300/40">
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wide text-base-content/70">
              Live Log
            </h4>
            {!logText && (
              <p className="text-xs text-base-content/60">
                Logs appear here once the backend responds.
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-xs"
            onClick={clearLog}
            disabled={isRunning}
          >
            Clear
          </button>
        </header>
        <pre
          ref={logAreaRef}
          className="flex-1 whitespace-pre-wrap overflow-auto px-4 py-3 text-sm text-base-content/80 bg-base-300/40"
        >
          {logText || "—"}
        </pre>
      </section>
    </div>
  );
}
