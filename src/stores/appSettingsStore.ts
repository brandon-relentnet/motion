import { create } from "zustand";
import type { AppSettings } from "../types/settings";

type SettingsState = {
  cache: Record<string, AppSettings>;
  loading: boolean;
  error: string | null;
  fetchSettings: (app: string) => Promise<AppSettings | null>;
  saveSettings: (app: string, settings: Partial<AppSettings>) => Promise<AppSettings>;
  deleteSettings: (app: string) => Promise<void>;
};

export const useAppSettingsStore = create<SettingsState>((set, get) => ({
  cache: {},
  loading: false,
  error: null,

  fetchSettings: async (app) => {
    const cached = get().cache[app];
    if (cached) return cached;
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/apps/${encodeURIComponent(app)}/settings`);
      if (res.status === 404) {
        set({ loading: false });
        return null;
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch settings (${res.status})`);
      }
      const data = (await res.json()) as { settings: AppSettings };
      set((state) => ({
        cache: { ...state.cache, [app]: data.settings },
        loading: false,
      }));
      return data.settings;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ loading: false, error: message });
      throw error;
    }
  },

  saveSettings: async (app, settings) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/apps/${encodeURIComponent(app)}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to save settings (${res.status})`);
      }
      const data = (await res.json()) as { settings: AppSettings };
      set((state) => ({
        cache: { ...state.cache, [app]: data.settings },
        loading: false,
      }));
      return data.settings;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ loading: false, error: message });
      throw error;
    }
  },

  deleteSettings: async (app) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/apps/${encodeURIComponent(app)}/settings`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to delete settings (${res.status})`);
      }
      set((state) => {
        const next = { ...state.cache };
        delete next[app];
        return { cache: next, loading: false };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ loading: false, error: message });
      throw error;
    }
  },
}));

export const selectSettingsError = (state: SettingsState) => state.error;
export const selectSettingsLoading = (state: SettingsState) => state.loading;
