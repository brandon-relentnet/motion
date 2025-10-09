import { create } from "zustand";
import type { HistoryEvent } from "../types/deployment";

interface HistoryState {
  records: HistoryEvent[];
  loading: boolean;
  error: string | null;
  fetchHistory: (params?: HistoryQueryParams) => Promise<void>;
}

type HistoryQueryParams = {
  app?: string;
  limit?: number;
  type?: "deployment" | "action";
  status?: "success" | "failed" | "cancelled";
  since?: string;
  until?: string;
};

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
    if (params?.type) query.set("type", params.type);
    if (params?.status) query.set("status", params.status);
    if (params?.since) query.set("since", params.since);
    if (params?.until) query.set("until", params.until);

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
