export type DeploymentStatus = "success" | "failed" | "cancelled";
export type ActionStatus = "success" | "failed";

export type HistoryEvent = DeploymentEvent | ContainerActionEvent;

export interface DeploymentEvent {
  kind: "deployment";
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

export interface ContainerActionEvent {
  kind: "container-action";
  id: string;
  app: string;
  container: string;
  action: "start" | "stop" | "restart" | "remove";
  status: ActionStatus;
  timestamp: string;
  message?: string;
}
