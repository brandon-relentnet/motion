import { create } from "zustand";
import type { AppInfo } from "../types/app";
import { DEPLOY_TAB_ID } from "../constants/tabs";
import { useDeployFormStore } from "./deployFormStore";
import { useTabsStore } from "./tabsStore";
import type { DeployFramework } from "./deployFormStore";
import { useDeployHistoryStore } from "./deployHistoryStore";

type ApiAction = "start" | "stop" | "restart" | "remove";
type ContainerAction = ApiAction | "purge" | "update";

type ContainersState = {
  apps: AppInfo[];
  loading: boolean;
  error: string | null;
  pendingActions: Record<string, ContainerAction | null>;
  selectedApp: string | null;
  setSelectedApp: (app: string | null) => void;
  fetchApps: () => Promise<void>;
  runAction: (
    container: string,
    action: ApiAction,
    options?: { purge?: boolean }
  ) => Promise<void>;
  redeployApp: (appName: string) => Promise<void>;
};

export const useContainersStore = create<ContainersState>((set, get) => ({
  apps: [],
  loading: false,
  error: null,
  pendingActions: {},
  selectedApp: null,

  setSelectedApp: (app) => set({ selectedApp: app }),

  fetchApps: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/apps", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load containers (${response.status})`);
      }
      const data = (await response.json()) as { apps?: AppInfo[] };
      set({
        apps: data.apps ?? [],
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ loading: false, error: message });
    }
  },

  runAction: async (container, action, options) => {
    const appEntry = get().apps.find((app) => app.container === container);
    const appName = appEntry?.name ?? container;
    const { pendingActions } = get();
    const pendingKey: ContainerAction = options?.purge ? "purge" : action;
    set({
      pendingActions: { ...pendingActions, [container]: pendingKey },
      error: null,
    });

    try {
      const response = await fetch(
        `/api/containers/${encodeURIComponent(container)}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, purge: options?.purge ?? false }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Action failed (${response.status})`);
      }

      if (action === "remove") {
        set((state) => {
          const nextApps = state.apps.filter((app) => app.container !== container);
          const selectedApp = state.selectedApp === appName ? null : state.selectedApp;
          return { apps: nextApps, selectedApp };
        });
      } else {
        const data = (await response.json()) as { app: AppInfo };
        const updated = data.app;
        set((state) => ({
          apps: state.apps.map((app) =>
            app.container === container ? updated : app
          ),
        }));
      }
      void useDeployHistoryStore.getState().fetchHistory();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message });
      void useDeployHistoryStore.getState().fetchHistory();
      throw error;
    } finally {
      const nextPending = { ...get().pendingActions };
      delete nextPending[container];
      set({ pendingActions: nextPending });
    }
  },

  redeployApp: async (appName) => {
    const { pendingActions } = get();
    const target = get().apps.find((app) => app.name === appName);
    if (!target) {
      const message = `Container ${appName} not found.`;
      set({ error: message });
      throw new Error(message);
    }

    set({
      pendingActions: { ...pendingActions, [target.container]: "update" },
      error: null,
    });

    try {
      const response = await fetch(
        `/api/apps/${encodeURIComponent(appName)}/deploy-config`
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to load deploy config (${response.status})`);
      }

      const data = (await response.json()) as {
        config: {
          name: string;
          repoUrl: string;
          appPath?: string | null;
          variables?: string;
          framework: string;
          domain?: string;
          branch?: string | null;
        };
      };

      const config = data.config;
      const framework: DeployFramework = config.framework === "nextjs" ? "nextjs" : "vite";

      const payload = {
        name: config.name,
        repoUrl: config.repoUrl,
        appPath: config.appPath ?? null,
        variables: config.variables ?? "",
        framework,
        domain: config.domain ?? undefined,
        branch: config.branch ?? "main",
        submittedAt: new Date().toISOString(),
      };

      useDeployFormStore.getState().triggerDeploy(payload);
      useTabsStore.getState().setActiveTab(DEPLOY_TAB_ID);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message });
      throw error;
    } finally {
      const nextPending = { ...get().pendingActions };
      delete nextPending[target.container];
      set({ pendingActions: nextPending });
    }
  },
}));

export const selectApps = (state: ContainersState) => state.apps;
export const selectLoading = (state: ContainersState) => state.loading;
export const selectError = (state: ContainersState) => state.error;
export const selectPendingAction = (container: string) =>
  (state: ContainersState) => state.pendingActions[container] ?? null;
export const selectSelectedApp = (state: ContainersState) => state.selectedApp;
