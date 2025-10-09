import { create } from "zustand";
import type { DeployPayload } from "./deployFormStore";

export type DeployStep = "idle" | "git" | "build" | "publish";

const initialState = {
  step: "idle" as DeployStep,
  log: [] as string[],
  isRunning: false,
  error: null as string | null,
  lastCommit: null as string | null,
  payload: null as DeployPayload | null,
};

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
      log: state.log.concat(chunk),
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

  reset: () => set({ ...initialState, log: [] }),
}));
