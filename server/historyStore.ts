import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const historyFile = path.join(dataDir, "deploy-history.json");

async function ensureHistoryFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(historyFile);
  } catch {
    await fs.writeFile(historyFile, "[]", "utf8");
  }
}

export async function readDeploymentHistory(): Promise<DeploymentRecord[]> {
  await ensureHistoryFile();
  const raw = await fs.readFile(historyFile, "utf8");
  try {
    const data = JSON.parse(raw) as DeploymentRecord[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function appendDeploymentRecord(record: DeploymentRecord) {
  await ensureHistoryFile();
  const current = await readDeploymentHistory();
  current.push(record);
  await fs.writeFile(historyFile, JSON.stringify(current, null, 2), "utf8");
}
