import { create } from "zustand";

export type DeployFramework = "vite" | "nextjs";

export type DeployPayload = {
  name: string;
  repoUrl: string;
  appPath?: string | null;
  variables: string;
  framework: DeployFramework;
  domain?: string;
  branch?: string | null;
  submittedAt: string;
};

type SubmitResult =
  | { ok: true; payload: DeployPayload }
  | { ok: false; error: string };

export type DeployFormStatus = "idle" | "submitting" | "success";

type DeployFormState = {
  name: string;
  repoUrl: string;
  appPath: string;
  variables: string;
  framework: DeployFramework;
  domain: string;
  error: string | null;
  status: DeployFormStatus;
  statusMessage: string | null;
  lastPayload: DeployPayload | null;
  branch: string;
  queuedPayload: DeployPayload | null;
  triggerVersion: number;
  triggerDeploy: (payload: DeployPayload) => void;
  consumeTrigger: () => void;
  setField: (field: "name" | "repoUrl" | "appPath" | "variables" | "domain" | "branch", value: string) => void;
  setFramework: (framework: DeployFramework) => void;
  clearFeedback: () => void;
  setStatus: (status: DeployFormStatus, statusMessage?: string | null) => void;
  setError: (message: string) => void;
  setLastPayload: (payload: DeployPayload | null) => void;
  submit: () => SubmitResult;
};

function buildPayload(state: DeployFormState): DeployPayload {
  const trimmedPath = state.appPath.trim();
  return {
    name: state.name.trim(),
    repoUrl: state.repoUrl.trim(),
    appPath: trimmedPath ? trimmedPath : null,
    variables: state.variables,
    framework: state.framework,
    domain: state.domain.trim() ? state.domain.trim() : undefined,
    branch: state.branch.trim() ? state.branch.trim() : "main",
    submittedAt: new Date().toISOString(),
  };
}

export const useDeployFormStore = create<DeployFormState>((set, get) => ({
  name: "",
  repoUrl: "",
  appPath: "",
  variables: "",
  framework: "vite",
  domain: "",
  error: null,
  status: "idle",
  statusMessage: null,
  lastPayload: null,
  branch: "main",
  queuedPayload: null,
  triggerVersion: 0,

  setField: (field, value) =>
    set((state) => ({
      ...state,
      [field]: value,
      ...(state.error || state.status !== "idle" || state.statusMessage
        ? { error: null, status: "idle", statusMessage: null }
        : {}),
    })),

  setFramework: (framework) =>
    set((state) => ({
      ...state,
      framework,
      ...(state.error || state.status !== "idle" || state.statusMessage
        ? { error: null, status: "idle", statusMessage: null }
        : {}),
    })),

  clearFeedback: () =>
    set((state) =>
      state.error || state.status !== "idle" || state.statusMessage
        ? { error: null, status: "idle", statusMessage: null }
        : state
    ),

  setStatus: (status, statusMessage = null) =>
    set({ status, statusMessage, error: null }),

  setError: (message) => set({ error: message, status: "idle", statusMessage: null }),

  setLastPayload: (payload) => set({ lastPayload: payload }),

  triggerDeploy: (payload) =>
    set((state) => ({
      name: payload.name,
      repoUrl: payload.repoUrl,
      appPath: payload.appPath ?? "",
      variables: payload.variables ?? "",
      framework: payload.framework,
      domain: payload.domain ?? "",
      branch: payload.branch ?? state.branch ?? "main",
      lastPayload: payload,
      queuedPayload: payload,
      triggerVersion: state.triggerVersion + 1,
      status: "submitting",
      statusMessage: "Preparing redeploy…",
      error: null,
    })),

  consumeTrigger: () => set({ queuedPayload: null }),

  submit: () => {
    const { name, repoUrl } = get();
    const trimmedName = name.trim();
    const trimmedRepo = repoUrl.trim();

    if (!trimmedName) {
      const error = "Container name is required.";
      set({ error, status: "idle", statusMessage: null });
      return { ok: false, error };
    }

    if (!trimmedRepo) {
      const error = "Repository URL is required.";
      set({ error, status: "idle", statusMessage: null });
      return { ok: false, error };
    }

    try {
      const url = new URL(trimmedRepo);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
    } catch {
      const error = "Enter a valid HTTP(S) repository URL.";
      set({ error, status: "idle", statusMessage: null });
      return { ok: false, error };
    }

    const payload = buildPayload(get());

    set({
      error: null,
      status: "idle",
      statusMessage: null,
      lastPayload: payload,
    });

    return { ok: true, payload };
  },
}));
