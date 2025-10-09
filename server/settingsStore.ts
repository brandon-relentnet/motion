import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface AppSettings {
  app: string;
  notes?: string;
  owner?: string;
  publicEnv?: Record<string, string>;
  secrets?: Record<string, string>;
  domain?: string;
  repoUrl?: string;
  branch?: string;
  framework?: string;
  appPath?: string;
  lastCommit?: string;
  lastDeployedAt?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const settingsFile = path.join(dataDir, "settings.json");

async function ensureSettingsFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(settingsFile);
  } catch {
    await fs.writeFile(settingsFile, "{}", "utf8");
  }
}

export async function readAllSettings(): Promise<Record<string, AppSettings>> {
  await ensureSettingsFile();
  const raw = await fs.readFile(settingsFile, "utf8");
  try {
    const data = JSON.parse(raw) as Record<string, AppSettings>;
    if (!data || typeof data !== "object") return {};
    const result: Record<string, AppSettings> = {};
    for (const [key, value] of Object.entries(data)) {
      if (!value || typeof value !== "object") continue;
      result[key] = normalizeSettings({ ...value, app: key });
    }
    return result;
  } catch {
    return {};
  }
}

export async function readAppSettings(app: string): Promise<AppSettings | null> {
  const all = await readAllSettings();
  return all[app] ?? null;
}

export async function writeAppSettings(app: string, settings: Partial<AppSettings>) {
  const all = await readAllSettings();
  const next: AppSettings = normalizeSettings({
    ...(all[app] ?? { app }),
    ...settings,
    app,
  });
  all[app] = next;
  await persistAllSettings(all);
}

export async function deleteAppSettings(app: string) {
  const all = await readAllSettings();
  if (all[app]) {
    delete all[app];
    await persistAllSettings(all);
  }
}

async function persistAllSettings(all: Record<string, AppSettings>) {
  await ensureSettingsFile();
  await fs.writeFile(settingsFile, JSON.stringify(all, null, 2), "utf8");
}

function normalizeSettings(settings: AppSettings): AppSettings {
  const deployedAt = settings.lastDeployedAt ? new Date(settings.lastDeployedAt) : null;
  return {
    app: settings.app,
    notes: settings.notes?.trim() ? settings.notes.trim() : undefined,
    owner: settings.owner?.trim() ? settings.owner.trim() : undefined,
    publicEnv: sanitizeEnv(settings.publicEnv),
    secrets: sanitizeEnv(settings.secrets),
    domain: settings.domain?.trim() ? settings.domain.trim() : undefined,
    repoUrl: settings.repoUrl?.trim() ? settings.repoUrl.trim() : undefined,
    branch: settings.branch?.trim() ? settings.branch.trim() : undefined,
    framework: settings.framework?.trim() ? settings.framework.trim() : undefined,
    appPath: settings.appPath?.trim() ? settings.appPath.trim() : undefined,
    lastCommit: settings.lastCommit?.trim() ? settings.lastCommit.trim() : undefined,
    lastDeployedAt:
      deployedAt && !Number.isNaN(deployedAt.getTime())
        ? deployedAt.toISOString()
        : undefined,
  };
}

function sanitizeEnv(record?: Record<string, string>) {
  if (!record) return undefined;
  const entries = Object.entries(record)
    .map(([key, value]) => [key.trim(), value] as const)
    .filter(([key]) => Boolean(key));
  if (!entries.length) return undefined;
  const normalized: Record<string, string> = {};
  for (const [key, value] of entries) {
    normalized[key] = value;
  }
  return normalized;
}
