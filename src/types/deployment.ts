export type DeploymentStatus = "success" | "failed" | "cancelled";

export interface DeploymentRecord {
  id: string;
  app: string;
  container: string;
  repoUrl: string;
  branch: string;
  framework?: string;
  commit?: string;
  status: DeploymentStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  message?: string;
}
