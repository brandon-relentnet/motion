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
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return (data.map(normalizeEvent).filter(Boolean) as HistoryEvent[]);
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

function normalizeEvent(entry: unknown): HistoryEvent | null {
  if (!entry || typeof entry !== "object") return null;

  const record = entry as Record<string, unknown>;

  if (record.kind === "deployment") {
    return {
      kind: "deployment",
      id: String(record.id ?? ""),
      app: String(record.app ?? ""),
      container: String(record.container ?? ""),
      repoUrl: String(record.repoUrl ?? ""),
      branch: String(record.branch ?? ""),
      commit: record.commit ? String(record.commit) : undefined,
      framework: record.framework ? String(record.framework) : undefined,
      status: normalizeDeploymentStatus(record.status),
      startedAt: new Date(record.startedAt ?? Date.now()).toISOString(),
      completedAt: new Date(record.completedAt ?? record.startedAt ?? Date.now()).toISOString(),
      durationMs: Number.isFinite(record.durationMs as number)
        ? Number(record.durationMs)
        : Math.max(
            0,
            new Date(record.completedAt ?? Date.now()).getTime() -
              new Date(record.startedAt ?? Date.now()).getTime()
          ),
      message: record.message ? String(record.message) : undefined,
    } satisfies DeploymentEvent;
  }

  // Legacy array of deployments without kind
  if (record.app && record.container && record.startedAt && record.completedAt) {
    return {
      kind: "deployment",
      id: String(record.id ?? ""),
      app: String(record.app ?? ""),
      container: String(record.container ?? ""),
      repoUrl: String(record.repoUrl ?? ""),
      branch: String(record.branch ?? ""),
      commit: record.commit ? String(record.commit) : undefined,
      framework: record.framework ? String(record.framework) : undefined,
      status: normalizeDeploymentStatus(record.status),
      startedAt: new Date(record.startedAt as string).toISOString(),
      completedAt: new Date(record.completedAt as string).toISOString(),
      durationMs: Number.isFinite(record.durationMs as number)
        ? Number(record.durationMs)
        : Math.max(
            0,
            new Date(record.completedAt as string).getTime() -
              new Date(record.startedAt as string).getTime()
          ),
      message: record.message ? String(record.message) : undefined,
    } satisfies DeploymentEvent;
  }

  if (record.kind === "container-action") {
    return {
      kind: "container-action",
      id: String(record.id ?? ""),
      app: String(record.app ?? ""),
      container: String(record.container ?? ""),
      action: normalizeAction(record.action),
      status: normalizeActionStatus(record.status),
      timestamp: new Date(record.timestamp ?? Date.now()).toISOString(),
      message: record.message ? String(record.message) : undefined,
    } satisfies ContainerActionEvent;
  }

  return null;
}

function normalizeDeploymentStatus(value: unknown): DeploymentStatus {
  if (value === "failed" || value === "cancelled") return value;
  return "success";
}

function normalizeAction(value: unknown): ContainerActionEvent["action"] {
  if (value === "stop" || value === "restart" || value === "remove") return value;
  return "start";
}

function normalizeActionStatus(value: unknown): ActionStatus {
  return value === "failed" ? "failed" : "success";
}
