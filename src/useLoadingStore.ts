import { create } from "zustand";

type BadgeState = "idle" | "processing" | "success";

type LoadingStore = {
  progress: number;
  badge: BadgeState;
  _timer: number | null;
  start: () => void;
  reset: () => void;
};

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  progress: 0,
  badge: "idle",
  _timer: null,

  start: () => {
    const { _timer, progress } = get();
    if (_timer !== null) return;
    if (progress >= 1) set({ progress: 0 });
    set({ badge: "processing" });

    const id = window.setInterval(() => {
      const next = Math.min(1, get().progress + Math.random() * 0.2);
      set({ progress: next });
      if (next >= 1) {
        window.clearInterval(get()._timer!);
        set({ _timer: null, badge: "success" });
      }
    }, 500);

    set({ _timer: id });
  },

  reset: () => {
    const { _timer } = get();
    if (_timer !== null) window.clearInterval(_timer);
    set({ _timer: null, progress: 0, badge: "idle" });
  },
}));
