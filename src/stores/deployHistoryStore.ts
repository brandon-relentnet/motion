import { create } from "zustand";
import type { HistoryEvent } from "../types/deployment";

interface HistoryState {
  records: HistoryEvent[];
  loading: boolean;
  error: string | null;
  fetchHistory: (params?: { app?: string; limit?: number }) => Promise<void>;
}

export const useDeployHistoryStore = create<HistoryState>((set) => ({
  records: [],
  loading: false,
  error: null,

  fetchHistory: async (params) => {
    set({ loading: true, error: null });
    const query = new URLSearchParams();
    if (params?.app) query.set("app", params.app);
    if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
      query.set("limit", String(params.limit));
    }

    try {
      const response = await fetch(`/api/deployments${query.size ? `?${query.toString()}` : ""}`);
      if (!response.ok) {
        throw new Error(`Failed to load deployment history (${response.status})`);
      }
      const data = (await response.json()) as { deployments?: HistoryEvent[] };
      set({
        records: data.deployments ?? [],
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ loading: false, error: message });
    }
  },
}));

export const selectHistoryRecords = (state: HistoryState) => state.records;
export const selectHistoryLoading = (state: HistoryState) => state.loading;
export const selectHistoryError = (state: HistoryState) => state.error;
