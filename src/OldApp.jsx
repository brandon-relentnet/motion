import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import LoadingProgressBar, {
  AUTO_RESET_DELAY,
} from "./components/loading-progress-bar";

/* --------------------------- utilities --------------------------- */
function useAutoScroll(ref, dep) {
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [dep]);
}
function clsx(...p) {
  return p.filter(Boolean).join(" ");
}
const STEP_MARKERS = [
  { key: "git", label: "Git", find: "== Git clone/update ==" },
  { key: "build", label: "Build", find: "== Build with Node (docker) ==" },
  { key: "publish", label: "Publish", find: "== Publish with Nginx ==" },
];
const DEPLOY_BADGE_LABELS = {
  idle: "Deploy",
  processing: "Cancel",
  success: "Done",
  error: "Error",
};

/* ---------------------------- component -------------------------- */
export default function App() {
  // deploy form
  const [appname, setAppname] = useState("");
  const [giturl, setGiturl] = useState("");
  const [branch, setBranch] = useState("main");
  const [envText, setEnvText] = useState("");

  // state
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [health, setHealth] = useState(null);
  const [apps, setApps] = useState([]);

  // step/progress
  const [step, setStep] = useState(null); // git | build | publish
  const [lastCommit, setLastCommit] = useState("");
  const [badgeState, setBadgeState] = useState("idle");
  const [progressValue, setProgressValue] = useState(0);

  const logRef = useRef(null);
  const abortRef = useRef(null);
  const progressResetRef = useRef(null);
  const badgeIdleResetRef = useRef(null);
  useAutoScroll(logRef, log);

  const updateStepProgress = useCallback((nextKey) => {
    if (!nextKey) {
      setStep(null);
      setProgressValue(0);
      return;
    }
    setStep(nextKey);
    const idx = STEP_MARKERS.findIndex((s) => s.key === nextKey);
    if (idx >= 0) {
      setProgressValue((idx + 1) / STEP_MARKERS.length);
    }
  }, []);

  const scheduleProgressReset = useCallback(() => {
    if (progressResetRef.current) window.clearTimeout(progressResetRef.current);
    progressResetRef.current = window.setTimeout(() => {
      setProgressValue(0);
      updateStepProgress(null);
      progressResetRef.current = null;
    }, AUTO_RESET_DELAY);
  }, [updateStepProgress]);

  const scheduleBadgeIdleReset = useCallback(() => {
    if (badgeIdleResetRef.current)
      window.clearTimeout(badgeIdleResetRef.current);
    badgeIdleResetRef.current = window.setTimeout(() => {
      setBadgeState("idle");
      badgeIdleResetRef.current = null;
    }, AUTO_RESET_DELAY);
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (progressResetRef.current)
        window.clearTimeout(progressResetRef.current);
      if (badgeIdleResetRef.current)
        window.clearTimeout(badgeIdleResetRef.current);
    };
  }, []);

  async function fetchHealth() {
    try {
      const r = await fetch("/healthz");
      setHealth(r.ok);
    } catch {
      setHealth(false);
    }
  }
  async function fetchApps() {
    try {
      const r = await fetch("/api/apps", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setApps(data.apps || []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchHealth();
    fetchApps();
    const id = setInterval(fetchApps, 10000);
    return () => clearInterval(id);
  }, []);

  const startDeployment = useCallback(async () => {
    if (progressResetRef.current) window.clearTimeout(progressResetRef.current);
    if (badgeIdleResetRef.current)
      window.clearTimeout(badgeIdleResetRef.current);

    if (!appname?.trim() || !giturl?.trim()) {
      setErr("Please provide app name and repo URL.");
      setBadgeState("error");
      setProgressValue(0);
      updateStepProgress(null);
      scheduleBadgeIdleReset();
      setBusy(false);
      return;
    }

    setErr("");
    setLastCommit("");
    setLog("");
    setBusy(true);
    updateStepProgress("git");

    const controller = new AbortController();
    abortRef.current = controller;
    let cancelled = false;
    let succeeded = false;

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appname, giturl, branch, env: envText }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Deploy failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        buf += chunk;
        setLog((s) => s + chunk);

        if (chunk.includes(STEP_MARKERS[1].find)) updateStepProgress("build");
        if (chunk.includes(STEP_MARKERS[2].find)) updateStepProgress("publish");

        const commitLine = buf
          .split("\n")
          .find((ln) => ln.toLowerCase().startsWith("checked out commit:"));
        if (commitLine) {
          const c = commitLine.split(":").pop()?.trim();
          if (c) {
            setLastCommit((prev) => prev || c);
          }
        }
      }

      setProgressValue(1);
      succeeded = true;
    } catch (error) {
      if (error?.name === "AbortError") {
        cancelled = true;
        setErr("Deployment cancelled.");
      } else {
        setErr(String(error));
        setBadgeState("error");
        scheduleBadgeIdleReset();
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
      if (!cancelled) fetchApps();
      if (!succeeded) {
        if (!cancelled) setProgressValue(0);
        updateStepProgress(null);
      }
      if (cancelled) {
        setBadgeState("idle");
      }
    }
  }, [
    appname,
    giturl,
    branch,
    envText,
    updateStepProgress,
    scheduleBadgeIdleReset,
  ]);

  const handleFormSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      if (badgeState === "processing") return;
      if (progressResetRef.current)
        window.clearTimeout(progressResetRef.current);
      if (badgeIdleResetRef.current)
        window.clearTimeout(badgeIdleResetRef.current);
      setProgressValue(0);
      updateStepProgress(null);
      setBadgeState("processing");
      startDeployment();
    },
    [badgeState, startDeployment, updateStepProgress]
  );

  const handleCancel = useCallback(() => {
    if (progressResetRef.current) window.clearTimeout(progressResetRef.current);
    if (badgeIdleResetRef.current)
      window.clearTimeout(badgeIdleResetRef.current);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setBusy(false);
    setProgressValue(0);
    updateStepProgress(null);
  }, [updateStepProgress]);

  const handleComplete = useCallback(() => {
    scheduleProgressReset();
  }, [scheduleProgressReset]);

  function clearLog() {
    setLog("");
    setErr("");
    setLastCommit("");
    updateStepProgress(null);
  }

  async function act(container, action, purge = false) {
    try {
      const r = await fetch(
        `/api/containers/${encodeURIComponent(container)}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, purge }),
        }
      );
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || `HTTP ${r.status}`);
      }
      fetchApps();
    } catch (e) {
      setErr(`Action failed: ${String(e)}`);
    }
  }

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div
        className="absolute -z-10 blur-3xl opacity-25"
        style={{
          inset: "-20%",
          background:
            "radial-gradient(600px 400px at 20% 10%, #60a5fa, transparent), radial-gradient(700px 500px at 80% 0%, #a78bfa, transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        {/* header glass */}
        <Glassy className="p-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">NewApp UI</h1>
            <p className="text-sm opacity-80">
              Glassy controls for your SPA containers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={clsx(
                "badge badge-lg",
                health ? "badge-success" : "badge-error"
              )}
            >
              {health ? "Healthy" : "Unhealthy"}
            </span>
            <button
              className="btn btn-sm"
              onClick={() => {
                fetchHealth();
                fetchApps();
              }}
            >
              Refresh
            </button>
          </div>
        </Glassy>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* deploy form */}
          <Glassy asMotion className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Deploy</h2>
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="grid gap-3">
                <label className="form-control">
                  <div className="label">
                    <span className="label-text">App name (no spaces)</span>
                  </div>
                  <input
                    className="input input-bordered bg-white/5"
                    value={appname}
                    onChange={(e) => setAppname(e.target.value)}
                    placeholder="myscoreboard"
                    required
                  />
                </label>

                <label className="form-control">
                  <div className="label">
                    <span className="label-text">Git repo URL (HTTPS)</span>
                  </div>
                  <input
                    className="input input-bordered bg-white/5"
                    value={giturl}
                    onChange={(e) => setGiturl(e.target.value)}
                    placeholder="https://github.com/you/repo.git"
                    required
                  />
                  <div className="label">
                    <span className="label-text-alt opacity-70">
                      Private repos require container auth (.netrc/ PAT).
                    </span>
                  </div>
                </label>

                <label className="form-control">
                  <div className="label">
                    <span className="label-text">Branch</span>
                  </div>
                  <input
                    className="input input-bordered bg-white/5"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </label>

                <label className="form-control">
                  <div className="label">
                    <span className="label-text">
                      Vite build env (optional, VITE_* lines)
                    </span>
                  </div>
                  <textarea
                    className="textarea textarea-bordered bg-white/5"
                    rows={6}
                    value={envText}
                    onChange={(e) => setEnvText(e.target.value)}
                    placeholder={
                      "VITE_API_BASE=https://api.example.com\nVITE_FLAG=true"
                    }
                  />
                  <div className="label">
                    <span className="label-text-alt opacity-70">
                      Note: VITE_* is embedded and public.
                    </span>
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                <LoadingProgressBar
                  simulate={false}
                  startAutomatically={false}
                  value={Math.max(0, Math.min(1, progressValue))}
                  state={badgeState}
                  onStateChange={setBadgeState}
                  labels={DEPLOY_BADGE_LABELS}
                  onStart={startDeployment}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                  className="w-full !w-full !h-auto bg-transparent ring-0 outline-0 shadow-none p-0"
                  style={{ backgroundImage: "none" }}
                />

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn"
                      onClick={clearLog}
                      disabled={busy && !log}
                    >
                      Clear log
                    </button>
                  </div>
                  {lastCommit && (
                    <span className="text-xs opacity-70">
                      commit <code>{lastCommit}</code>
                    </span>
                  )}
                </div>
              </div>

              {err && (
                <div className="alert alert-error">
                  <span className="font-semibold">Error:</span>
                  <span>{err}</span>
                </div>
              )}
            </form>
          </Glassy>

          {/* containers/apps */}
          <Glassy asMotion className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Containers</h2>
              <span className="text-xs opacity-70">
                prefix: <code>static_</code>
              </span>
            </div>

            <div className="overflow-x-auto">
              {apps?.length ? (
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>App</th>
                      <th>State</th>
                      <th>Status</th>
                      <th style={{ width: 260 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr key={a.name}>
                        <td>
                          <div className="flex flex-col">
                            <code className="text-sm">{a.name}</code>
                            <span className="text-xs opacity-60">
                              {a.container}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={clsx(
                              "badge",
                              a.state === "running"
                                ? "badge-success"
                                : a.state === "restarting"
                                  ? "badge-warning"
                                  : a.state === "exited"
                                    ? "badge-error"
                                    : "badge-ghost"
                            )}
                          >
                            {a.state}
                          </span>
                        </td>
                        <td className="text-xs">{a.status}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="btn btn-xs"
                              onClick={() => act(a.container, "start")}
                            >
                              Start
                            </button>
                            <button
                              className="btn btn-xs"
                              onClick={() => act(a.container, "stop")}
                            >
                              Stop
                            </button>
                            <button
                              className="btn btn-xs"
                              onClick={() => act(a.container, "restart")}
                            >
                              Restart
                            </button>
                            <button
                              className="btn btn-xs btn-error"
                              onClick={() => act(a.container, "remove")}
                            >
                              Remove
                            </button>
                            <button
                              className="btn btn-xs btn-outline btn-error"
                              onClick={() =>
                                confirm(`Delete app files for "${a.name}"?`) &&
                                act(a.container, "remove", true)
                              }
                            >
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm opacity-70">No apps yet.</div>
              )}
            </div>
          </Glassy>
        </div>

        {/* live log */}
        <Glassy asMotion className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Live log</h2>
            <span
              className={clsx("badge", busy ? "badge-warning" : "badge-ghost")}
            >
              {busy ? "running" : "idle"}
            </span>
          </div>
          <pre
            ref={logRef}
            className="p-3 rounded h-[46vh] overflow-auto whitespace-pre-wrap bg-black/30 border border-white/10"
          >
            {log || "—"}
          </pre>
        </Glassy>

        {/* footer */}
        <div className="text-center text-xs opacity-60 pb-8">
          Glassy theme • Tailwind + daisyUI + Motion
        </div>
      </div>
    </div>
  );
}

/* ------------------------- subcomponents ------------------------- */
function Glassy({ children, className = "", asMotion = false }) {
  const base = clsx(
    "rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl",
    className
  );
  return asMotion ? (
    <motion.div
      className={base}
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
    >
      {children}
    </motion.div>
  ) : (
    <div className={base}>{children}</div>
  );
}
