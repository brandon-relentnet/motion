import {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Accordion from "./Accordian";
import LoadingProgressBar from "./LoadingProgressBar";
import MultiStateBadge from "./MultiStateBadge";
import {
  useDeployFormStore,
  type DeployFormStatus,
} from "../stores/deployFormStore";
import { useLoadingStore } from "../useLoadingStore";
import { useDeploySessionStore } from "../stores/deploySessionStore";
import {
  DEPLOY_STEP_MARKERS,
  deployStream,
} from "../lib/deployClient";
import { useContainersStore } from "../stores/containersStore";
import { useAppSettingsStore } from "../stores/appSettingsStore";
import { envObjectToText } from "../lib/env";
import { useDeployHistoryStore } from "../stores/deployHistoryStore";

export default function DeploymentForm() {
  const {
    name,
    repoUrl,
    appPath,
    variables,
    domain,
    framework,
    error,
    status,
    statusMessage,
    setField,
    setFramework,
    clearFeedback,
    setStatus,
    setError,
    setLastPayload,
    submit,
  } = useDeployFormStore();

  const startLoading = useLoadingStore((state) => state.start);
  const setProgress = useLoadingStore((state) => state.setProgress);
  const completeLoading = useLoadingStore((state) => state.complete);
  const cancelLoading = useLoadingStore((state) => state.cancel);
  const resetLoading = useLoadingStore((state) => state.reset);

  const startSession = useDeploySessionStore((state) => state.start);
  const setSessionStep = useDeploySessionStore((state) => state.setStep);
  const appendLog = useDeploySessionStore((state) => state.appendLog);
  const setCommit = useDeploySessionStore((state) => state.setCommit);
  const completeSession = useDeploySessionStore((state) => state.complete);
  const failSession = useDeploySessionStore((state) => state.fail);
  const resetSession = useDeploySessionStore((state) => state.reset);
  const sessionRunning = useDeploySessionStore((state) => state.isRunning);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const fetchSettings = useAppSettingsStore((state) => state.fetchSettings);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const nameValue = useDeployFormStore((state) => state.name);
  const variablesValue = useDeployFormStore((state) => state.variables);
  const domainValue = useDeployFormStore((state) => state.domain);
  const setDeployField = useDeployFormStore((state) => state.setField);

  useEffect(() => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    let cancelled = false;
    void fetchSettings(trimmed)
      .then((settings) => {
        if (!settings || cancelled) return;
        if (settings.publicEnv && variablesValue.trim().length === 0) {
          setDeployField("variables", envObjectToText(settings.publicEnv));
        }
        if (settings.domain && domainValue.trim().length === 0) {
          setDeployField("domain", settings.domain);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSettings, nameValue, setDeployField, variablesValue, domainValue]);

  const handleChange = useCallback(
    (field: "name" | "repoUrl" | "appPath" | "variables" | "domain") =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        clearFeedback();
        setField(field, event.target.value);
      },
    [clearFeedback, setField]
  );

  const handleFrameworkChange = useCallback(
    (value: typeof framework) => {
      clearFeedback();
      setFramework(value);
    },
    [clearFeedback, setFramework]
  );

  const handleReset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    cancelLoading();
    resetSession();
    setStatus("idle");
    clearFeedback();
    setIsSubmitting(false);
  }, [cancelLoading, clearFeedback, resetSession, setStatus]);

  const runDeployment = useCallback(async () => {
    if (isSubmitting || sessionRunning) {
      return;
    }

    const result = submit();
    if (!result.ok) {
      return;
    }

    const payload = result.payload;
    setIsSubmitting(true);
    setStatus("submitting", "Starting deployment…");
    setLastPayload(payload);
    startSession(payload);
    startLoading();
    setProgress(0.05);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await deployStream(payload, {
        signal: controller.signal,
        onChunk: (chunk) => appendLog(chunk),
        onStep: (step) => {
          setSessionStep(step);
          const index = DEPLOY_STEP_MARKERS.findIndex(
            (marker) => marker.key === step
          );
          if (index >= 0) {
            const progressValue = (index + 1) / DEPLOY_STEP_MARKERS.length;
            setProgress(progressValue);
          }
        },
        onCommit: (commit) => setCommit(commit),
      });

      completeSession();
      completeLoading();
      setStatus(
        "success",
        "Deployment finished. Review logs in the Deploy tab."
      );
      void useContainersStore.getState().fetchApps();
      void useDeployHistoryStore.getState().fetchHistory();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.name === "AbortError"
            ? "Deployment cancelled."
            : error.message
          : "Deployment failed.";

      if (error instanceof Error && error.name === "AbortError") {
        setStatus("idle", "Deployment cancelled.");
        cancelLoading();
      } else {
        setError(message);
        resetLoading();
      }

      failSession(message);
    } finally {
      controllerRef.current = null;
      setIsSubmitting(false);
    }
  }, [
    appendLog,
    cancelLoading,
    completeLoading,
    completeSession,
    failSession,
    isSubmitting,
    sessionRunning,
    setCommit,
    setError,
    setLastPayload,
    setProgress,
    setSessionStep,
    setStatus,
    startLoading,
    startSession,
    resetLoading,
    submit,
  ]);

  const handleStart = useCallback(() => {
    void runDeployment();
  }, [runDeployment]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleStart();
    },
    [handleStart]
  );

  const helperText = useMemo(() => {
    if (error) return { tone: "error", message: error } as const;
    if (statusMessage) {
      const tone: DeployFormStatus = status;
      return { tone, message: statusMessage } as const;
    }
    return null;
  }, [error, status, statusMessage]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <h1 className="text-2xl font-poppins">Deploy a new container</h1>
      <div className="flex gap-2 flex-col justify-evenly items-center w-full">
        <label className="input w-full">
          Name
          <input
            type="search"
            className="grow"
            placeholder="Project Name"
            value={name}
            onChange={handleChange("name")}
            autoComplete="off"
          />
        </label>
        <label className="input w-full">
          Link
          <input
            type="url"
            className="grow"
            placeholder="https://github.com/user/repo.git"
            value={repoUrl}
            onChange={handleChange("repoUrl")}
            autoComplete="off"
          />
        </label>
        <label className="input w-full">
          Path
          <input
            type="text"
            className="grow"
            placeholder="src/app/"
            value={appPath}
            onChange={handleChange("appPath")}
            autoComplete="off"
          />
          <span className="badge badge-neutral badge-xs">Optional</span>
        </label>
        <label className="input w-full">
          Domain
          <input
            type="text"
            className="grow"
            placeholder="app.example.com"
            value={domain}
            onChange={handleChange("domain")}
            autoComplete="off"
          />
          <span className="badge badge-neutral badge-xs">Optional</span>
        </label>
        <Accordion
          framework={framework}
          onFrameworkChange={handleFrameworkChange}
          variables={variables}
          onVariablesChange={(value) => {
            clearFeedback();
            setField("variables", value);
          }}
        />
        {helperText && (
          <p
            className={`w-full text-sm ${
              helperText.tone === "error"
                ? "text-error"
                : helperText.tone === "success"
                  ? "text-success"
                  : "text-info"
            }`}
          >
            {helperText.message}
          </p>
        )}
      </div>
      <div className="flex gap-4 items-center">
        <div className="block w-full">
          <LoadingProgressBar />
        </div>
        <MultiStateBadge onStart={handleStart} onReset={handleReset} />
      </div>
    </form>
  );
}
