import { create } from "zustand";
import type { DeployPayload } from "./deployFormStore";

export type DeployStep = "idle" | "git" | "build" | "publish";

const STORAGE_KEY = "motion.deploy.session";
const LOG_LIMIT = 600;

const loadPersistedSession = () => {
  if (typeof window === "undefined") {
    return {
      log: [] as string[],
      lastCommit: null as string | null,
      payload: null as DeployPayload | null,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        log: [] as string[],
        lastCommit: null as string | null,
        payload: null as DeployPayload | null,
      };
    }
    const parsed = JSON.parse(raw) as {
      log?: unknown;
      lastCommit?: unknown;
      payload?: unknown;
    };
    return {
      log: Array.isArray(parsed.log) ? (parsed.log as string[]) : [],
      lastCommit:
        typeof parsed.lastCommit === "string" || parsed.lastCommit === null
          ? (parsed.lastCommit as string | null)
          : null,
      payload:
        parsed.payload && typeof parsed.payload === "object"
          ? (parsed.payload as DeployPayload)
          : null,
    };
  } catch (error) {
    console.warn("[deploy] failed to restore session", error);
    return {
      log: [] as string[],
      lastCommit: null as string | null,
      payload: null as DeployPayload | null,
    };
  }
};

const persisted = loadPersistedSession();

const baseState = {
  step: "idle" as DeployStep,
  log: persisted.log,
  isRunning: false,
  error: null as string | null,
  lastCommit: persisted.lastCommit,
  payload: persisted.payload,
};

const initialState = { ...baseState };

type DeploySessionState = typeof initialState & {
  start: (payload: DeployPayload) => void;
  setStep: (step: DeployStep) => void;
  appendLog: (chunk: string) => void;
  setCommit: (commit: string) => void;
  complete: () => void;
  fail: (message: string) => void;
  reset: () => void;
};

export const useDeploySessionStore = create<DeploySessionState>((set) => ({
  ...initialState,

  start: (payload) =>
    set({
      ...initialState,
      log: [],
      payload,
      isRunning: true,
    }),

  setStep: (step) =>
    set((state) => ({
      ...state,
      step,
    })),

  appendLog: (chunk) =>
    set((state) => ({
      ...state,
      log: [...state.log, chunk].slice(-LOG_LIMIT),
    })),

  setCommit: (commit) =>
    set((state) => ({
      ...state,
      lastCommit: commit,
    })),

  complete: () =>
    set((state) => ({
      ...state,
      isRunning: false,
    })),

  fail: (message) =>
    set((state) => ({
      ...state,
      isRunning: false,
      error: message,
    })),

  reset: () => {
    clearPersistedSession();
    set({ ...baseState, log: [] });
  },
}));

const persistSession = (state: Pick<DeploySessionState, "log" | "lastCommit" | "payload">) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        log: state.log.slice(-LOG_LIMIT),
        lastCommit: state.lastCommit,
        payload: state.payload,
      })
    );
  } catch (error) {
    console.warn("[deploy] failed to persist session", error);
  }
};

function clearPersistedSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

if (typeof window !== "undefined") {
  useDeploySessionStore.subscribe((state) => {
    persistSession({
      log: state.log,
      lastCommit: state.lastCommit,
      payload: state.payload,
    });
  });
}
