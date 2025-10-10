export type ContainerState = "running" | "restarting" | "exited";

export interface AppInfo {
  name: string;
  container: string;
  state: ContainerState;
  status: string;
  updatedAt: string;
  url?: string;
  repoUrl?: string;
  branch?: string;
  framework?: string;
  lastDeployedAt?: string;
}
