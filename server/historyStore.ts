import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  commit?: string;
  framework?: string;
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const historyFile = path.join(dataDir, "history.json");

async function ensureHistoryFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(historyFile);
  } catch {
    await fs.writeFile(historyFile, "[]", "utf8");
  }
}

export async function readHistory(): Promise<HistoryEvent[]> {
  await ensureHistoryFile();
  const raw = await fs.readFile(historyFile, "utf8");
  try {
    const data = JSON.parse(raw) as HistoryEvent[] | any[];
    if (!Array.isArray(data)) return [];
    return data.map(normalizeEvent).filter(Boolean) as HistoryEvent[];
  } catch {
    return [];
  }
}

export async function appendHistoryEvent(event: HistoryEvent) {
  await ensureHistoryFile();
  const current = await readHistory();
  current.push(event);
  await fs.writeFile(historyFile, JSON.stringify(current, null, 2), "utf8");
}

function normalizeEvent(entry: any): HistoryEvent | null {
  if (!entry || typeof entry !== "object") return null;

  if (entry.kind === "deployment") {
    return {
      kind: "deployment",
      id: String(entry.id ?? ""),
      app: String(entry.app ?? ""),
      container: String(entry.container ?? ""),
      repoUrl: String(entry.repoUrl ?? ""),
      branch: String(entry.branch ?? ""),
      commit: entry.commit ? String(entry.commit) : undefined,
      framework: entry.framework ? String(entry.framework) : undefined,
      status: normalizeDeploymentStatus(entry.status),
      startedAt: new Date(entry.startedAt ?? Date.now()).toISOString(),
      completedAt: new Date(entry.completedAt ?? entry.startedAt ?? Date.now()).toISOString(),
      durationMs: Number.isFinite(entry.durationMs)
        ? Number(entry.durationMs)
        : Math.max(0, new Date(entry.completedAt ?? Date.now()).getTime() - new Date(entry.startedAt ?? Date.now()).getTime()),
      message: entry.message ? String(entry.message) : undefined,
    } satisfies DeploymentEvent;
  }

  // Legacy array of deployments without kind
  if (entry.app && entry.container && entry.startedAt && entry.completedAt) {
    return {
      kind: "deployment",
      id: String(entry.id ?? ""),
      app: String(entry.app ?? ""),
      container: String(entry.container ?? ""),
      repoUrl: String(entry.repoUrl ?? ""),
      branch: String(entry.branch ?? ""),
      commit: entry.commit ? String(entry.commit) : undefined,
      framework: entry.framework ? String(entry.framework) : undefined,
      status: normalizeDeploymentStatus(entry.status),
      startedAt: new Date(entry.startedAt).toISOString(),
      completedAt: new Date(entry.completedAt).toISOString(),
      durationMs: Number.isFinite(entry.durationMs)
        ? Number(entry.durationMs)
        : Math.max(0, new Date(entry.completedAt).getTime() - new Date(entry.startedAt).getTime()),
      message: entry.message ? String(entry.message) : undefined,
    } satisfies DeploymentEvent;
  }

  if (entry.kind === "container-action") {
    return {
      kind: "container-action",
      id: String(entry.id ?? ""),
      app: String(entry.app ?? ""),
      container: String(entry.container ?? ""),
      action: normalizeAction(entry.action),
      status: normalizeActionStatus(entry.status),
      timestamp: new Date(entry.timestamp ?? Date.now()).toISOString(),
      message: entry.message ? String(entry.message) : undefined,
    } satisfies ContainerActionEvent;
  }

  return null;
}

function normalizeDeploymentStatus(value: any): DeploymentStatus {
  if (value === "failed" || value === "cancelled") return value;
  return "success";
}

function normalizeAction(value: any): ContainerActionEvent["action"] {
  if (value === "stop" || value === "restart" || value === "remove") return value;
  return "start";
}

function normalizeActionStatus(value: any): ActionStatus {
  return value === "failed" ? "failed" : "success";
}
