import { create } from "zustand";

type BadgeState = "idle" | "processing" | "success" | "cancelled";

type LoadingStore = {
  progress: number;
  badge: BadgeState;
  start: () => void;
  setProgress: (value: number) => void;
  complete: () => void;
  cancel: () => void;
  reset: () => void;
};

export const useLoadingStore = create<LoadingStore>((set) => ({
  progress: 0,
  badge: "idle",

  start: () =>
    set({
      badge: "processing",
      progress: 0,
    }),

  setProgress: (value) =>
    set((state) => ({
      progress: Math.max(0, Math.min(1, value)),
      badge: state.badge === "idle" ? "processing" : state.badge,
    })),

  complete: () =>
    set({
      badge: "success",
      progress: 1,
    }),

  cancel: () =>
    set({
      badge: "cancelled",
      progress: 0,
    }),

  reset: () =>
    set({
      badge: "idle",
      progress: 0,
    }),
}));
