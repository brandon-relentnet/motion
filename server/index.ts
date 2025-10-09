import cors from "cors";
import express from "express";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm, mkdir, readdir, copyFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  appendHistoryEvent,
  readHistory,
  type DeploymentStatus,
  type HistoryEvent,
} from "./historyStore";

const app = express();
const port = Number.parseInt(process.env.API_PORT ?? process.env.PORT ?? "4000", 10);

app.use(cors());
app.use(express.json());

type ContainerState = "running" | "restarting" | "exited";

interface AppInfo {
  name: string;
  container: string;
  state: ContainerState;
  status: string;
  updatedAt: string;
  url?: string;
}
const containerPrefix = process.env.CONTAINER_PREFIX ?? "lecrev_";
const pendingApps = new Map<string, AppInfo>();

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api/apps", async (_req, res) => {
  try {
    let dockerApps: AppInfo[] = [];
    try {
      dockerApps = await listDockerContainers();
    } catch (error) {
      console.error("[deploy] failed to list docker containers", error);
    }

    const byName = new Map<string, AppInfo>();

    for (const app of dockerApps) {
      byName.set(app.name, app);
    }

    for (const [name, pending] of pendingApps.entries()) {
      if (!byName.has(name)) {
        byName.set(name, pending);
      } else {
        const current = byName.get(name)!;
        if (pending.url && !current.url) {
          current.url = pending.url;
        }
      }
    }

    res.json({ apps: Array.from(byName.values()) });
  } catch (error) {
    console.error("[deploy] failed to assemble app list", error);
    res.status(500).json({ error: "Failed to list applications" });
  }
});

app.get("/api/deployments", async (req, res) => {
  try {
    const history = await readHistory();
    const appFilter = typeof req.query.app === "string" ? req.query.app.trim() : "";
    const limitParam = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : undefined;

    let records = history;
    if (appFilter) {
      records = records.filter((record) => record.app === appFilter);
    }

    records = records
      .slice()
      .sort((a, b) =>
        eventTimestamp(b).getTime() - eventTimestamp(a).getTime()
      );

    if (limitParam && Number.isFinite(limitParam) && limitParam > 0) {
      records = records.slice(0, limitParam);
    }

    res.json({ deployments: records });
  } catch (error) {
    console.error("[deploy] failed to load deployment history", error);
    res.status(500).json({ error: "Failed to load deployment history" });
  }
});

app.post("/api/deploy", async (req, res) => {
  const { name, repoUrl, framework, appPath, branch: branchInput } = req.body ?? {};
  if (!name || !repoUrl) {
    return res.status(400).json({ error: "Both name and repoUrl are required." });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.flushHeaders();

  let aborted = false;
  let activeProcess: ChildProcess | null = null;

  res.on("close", () => {
    if (!res.writableEnded) {
      aborted = true;
      console.warn("[deploy] client disconnected before completion");
      activeProcess?.kill("SIGTERM");
    }
  });

  const safeWrite = (message: string) => {
    if (!aborted) {
      res.write(message);
      res.flush?.();
      console.log(message.trimEnd());
    }
  };

  safeWrite(`Starting deployment for ${name}\n`);
  safeWrite(`Repository: ${repoUrl}\n`);
  if (framework) safeWrite(`Framework: ${framework}\n`);
  if (appPath) safeWrite(`App Path: ${appPath}\n`);

  const branch = typeof branchInput === "string" && branchInput.trim() ? branchInput.trim() : "main";

  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "motion-deploy-"));
  console.log("[deploy] workspace", workspaceRoot);

  const startedAt = Date.now();
  let commitSha: string | undefined;
  let publishResult: { container: string; status: string; url?: string } | undefined;
  let status: DeploymentStatus = "success";
  let errorMessage: string | undefined;

  try {
    console.log("[deploy] entering git stage");
    console.log("[deploy] aborted before git stage?", aborted);
    safeWrite("== Git clone/update ==\n");
    console.log("[deploy] git clone invoked for", repoUrl, "branch", branch);
    const { commit } = await runGitClone({
      repoUrl,
      branch,
      destination: workspaceRoot,
      onProcess: (child) => {
        activeProcess = child;
        console.log("[deploy] spawned git pid", child.pid);
      },
      onOutput: safeWrite,
    });
    console.log("[deploy] git clone finished", workspaceRoot);

    console.log("[deploy] writing commit line");
    safeWrite(`Checked out commit: ${commit}\n`);
    commitSha = commit;

    if (!aborted) {
      await runBuildPipeline({
        cwd: workspaceRoot,
        onProcess: (child) => {
          activeProcess = child;
        },
        onOutput: safeWrite,
        onStage: (marker) => safeWrite(`${marker}\n`),
        abortedRef: () => aborted,
      });
    }

    if (aborted) {
      safeWrite("Deployment cancelled by client.\n");
      status = "cancelled";
      errorMessage = "Deployment cancelled by client.";
      return res.end();
    }

    safeWrite("== Publish with Nginx ==\n");
    publishResult = await publishBuild({
      name,
      sourceDist: path.join(workspaceRoot, "dist"),
      baseOutputDir: process.env.DEPLOY_OUTPUT_DIR,
      baseUrl: process.env.DEPLOY_BASE_URL,
      onOutput: safeWrite,
    });

    upsertApp({
      name,
      container: publishResult.container,
      state: "running",
      status: publishResult.status,
      url: publishResult.url,
    });

    safeWrite("Deployment complete.\n");
    res.end();
  } catch (error) {
    console.error("[deploy] deploy failed", error);
    const message = error instanceof Error ? error.message : String(error);
    safeWrite(`Deployment failed: ${message}\n`);
    res.destroy(new Error(message));
    status =
      error instanceof Error && error.name === "AbortError" ? "cancelled" : "failed";
    errorMessage = message;
  } finally {
    activeProcess?.kill("SIGTERM");
    await rm(workspaceRoot, { recursive: true, force: true });
    const endedAt = Date.now();
    const event: HistoryEvent = {
      kind: "deployment",
      id: crypto.randomUUID(),
      app: name,
      container: publishResult?.container ?? `${containerPrefix}${name}`,
      repoUrl,
      branch,
      framework,
      commit: commitSha,
      status,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(endedAt).toISOString(),
      durationMs: endedAt - startedAt,
      ...(errorMessage ? { message: errorMessage } : {}),
    };
    try {
      await appendHistoryEvent(event);
    } catch (historyError) {
      console.error("[deploy] failed to append deployment record", historyError);
    }
  }
});

app.post("/api/containers/:container/action", async (req, res) => {
  const container = String(req.params.container);
  const { action, purge } = req.body ?? {};

  if (!container.startsWith(containerPrefix)) {
    return res.status(400).json({ error: "Container not managed by this service." });
  }

  const appName = container.slice(containerPrefix.length);

  try {
    switch (action) {
      case "start":
        await runDockerCommand(["start", container]);
        break;
      case "stop":
        await runDockerCommand(["stop", container]);
        break;
      case "restart":
        await runDockerCommand(["restart", container]);
        break;
      case "remove":
        await runDockerCommand(["rm", container]);
        if (purge) {
          await purgeDeployOutput(appName);
        }
        pendingApps.delete(appName);
        await recordContainerAction({
          app: appName,
          container,
          action: "remove",
          status: "success",
          message: purge ? "Removed and purged build artifacts." : undefined,
        });
        return res.json({ ok: true, removed: true, purged: Boolean(purge) });
      default:
        return res.status(400).json({ error: `Unknown action ${action}` });
    }

    const apps = await listDockerContainers();
    const updated = apps.find((item) => item.container === container);
    if (!updated) {
      await recordContainerAction({
        app: appName,
        container,
        action,
        status: "failed",
        message: "Container vanished after action.",
      });
      return res.status(404).json({ error: `Container ${container} not found after action.` });
    }

    const pending = pendingApps.get(appName);
    if (pending?.url && !updated.url) {
      updated.url = pending.url;
    }

    await recordContainerAction({
      app: appName,
      container,
      action,
      status: "success",
    });

    res.json({ ok: true, app: updated });
  } catch (error) {
    console.error(`[deploy] action ${action} failed for ${container}`, error);
    const message = error instanceof Error ? error.message : String(error);
    await recordContainerAction({
      app: appName,
      container,
      action,
      status: "failed",
      message,
    });
    res.status(500).json({ error: message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

function upsertApp({
  name,
  container,
  state,
  status,
  url,
}: {
  name: string;
  container: string;
  state: ContainerState;
  status: string;
  url?: string;
}) {
  pendingApps.set(name, {
    name,
    container,
    state,
    status,
    updatedAt: new Date().toISOString(),
    ...(url ? { url } : {}),
  });
}

async function runGitClone({
  repoUrl,
  branch,
  destination,
  onProcess,
  onOutput,
}: {
  repoUrl: string;
  branch: string;
  destination: string;
  onProcess: (child: ChildProcess) => void;
  onOutput: (text: string) => void;
}): Promise<{ commit: string }> {
  return new Promise((resolve, reject) => {
    const args = ["clone", "--depth", "1", "--single-branch", "--branch", branch, repoUrl, destination];
    const child = spawn("git", args, { stdio: ["ignore", "pipe", "pipe"] });
    onProcess(child);

    const handleData = (buffer: Buffer) => {
      const text = buffer.toString();
      onOutput(text);
    };

    child.stdout.on("data", handleData);
    child.stderr.on("data", handleData);

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(`Git exited with code ${code}`));
        return;
      }

      try {
        const commit = await resolveCommit(destination);
        resolve({ commit });
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function resolveCommit(directory: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["rev-parse", "HEAD"], { cwd: directory, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (buffer) => {
      output += buffer.toString();
    });

    child.stderr.on("data", (buffer) => {
      errorOutput += buffer.toString();
    });

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || `git rev-parse exited with code ${code}`));
        return;
      }
      resolve(output.trim());
    });
  });
}

async function runBuildPipeline({
  cwd,
  onProcess,
  onOutput,
  onStage,
  abortedRef,
}: {
  cwd: string;
  onProcess: (child: ChildProcess) => void;
  onOutput: (text: string) => void;
  onStage: (marker: string) => void;
  abortedRef: () => boolean;
}) {
  onStage("== Build with Node (docker) ==");
  await runCommand({
    command: "npm",
    args: ["install"],
    cwd,
    onProcess,
    onOutput,
    abortedRef,
    label: "npm install",
  });

  await runCommand({
    command: "npm",
    args: ["run", "build"],
    cwd,
    onProcess,
    onOutput,
    abortedRef,
    label: "npm run build",
  });
}

async function runCommand({
  command,
  args,
  cwd,
  onProcess,
  onOutput,
  abortedRef,
  label,
}: {
  command: string;
  args: string[];
  cwd: string;
  onProcess: (child: ChildProcess) => void;
  onOutput: (text: string) => void;
  abortedRef: () => boolean;
  label: string;
}) {
  if (abortedRef()) {
    return;
  }

  onOutput(`$ ${command} ${args.join(" ")}\n`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    onProcess(child);

    const forward = (buffer: Buffer) => onOutput(buffer.toString());
    child.stdout.on("data", forward);
    child.stderr.on("data", forward);

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${label} exited with code ${code}`));
      }
    });
  });
}

async function publishBuild({
  name,
  sourceDist,
  baseOutputDir,
  baseUrl,
  onOutput,
}: {
  name: string;
  sourceDist: string;
  baseOutputDir?: string;
  baseUrl?: string;
  onOutput: (text: string) => void;
}): Promise<{ container: string; status: string; url?: string }> {
  try {
    await stat(sourceDist);
  } catch {
    throw new Error(`dist directory not found at ${sourceDist}`);
  }

  const container = `${containerPrefix}${name}`;
  const root = resolveDeployRoot(baseOutputDir);
  const destDir = path.join(root, name);

  await mkdir(root, { recursive: true });
  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });

  onOutput(`Copying build artifacts to ${destDir}\n`);
  await copyDirectory(sourceDist, destDir);
  onOutput("Refreshing static container...\n");

  await ensureStaticContainer({
    containerName: container,
    bundleDir: destDir,
    network: process.env.REVERSE_PROXY_NETWORK,
    onOutput,
  });

  const url = buildAppUrl(name, baseUrl);

  return {
    container,
    status: "Up just now",
    url,
  };
}

async function copyDirectory(source: string, destination: string) {
  const entries = await readdir(source, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      if (entry.isDirectory()) {
        await mkdir(destPath, { recursive: true });
        await copyDirectory(srcPath, destPath);
      } else if (entry.isFile()) {
        await copyFile(srcPath, destPath);
      }
    })
  );
}

async function listDockerContainers(): Promise<AppInfo[]> {
  return new Promise((resolve, reject) => {
    const args = [
      "ps",
      "--all",
      "--filter",
      `name=${containerPrefix}`,
      "--format",
      "{{json .}}",
    ];

    const child = spawn("docker", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (buffer) => {
      stdout += buffer.toString();
    });
    child.stderr.on("data", (buffer) => {
      stderr += buffer.toString();
    });

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr.trim() || `docker ps exited with code ${code}`));
      }

      const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
      const apps: AppInfo[] = [];

      for (const line of lines) {
        try {
          const data = JSON.parse(line) as Record<string, string>;
          const containerName = data.Names;
          if (!containerName || !containerName.startsWith(containerPrefix)) {
            continue;
          }

          const name = containerName.slice(containerPrefix.length);
          const state = normalizeContainerState(data.State);
          const status = data.Status || state;

          let updatedAt = new Date().toISOString();
          const createdAt = data.CreatedAt;
          if (createdAt) {
            const parsed = new Date(createdAt);
            if (!Number.isNaN(parsed.getTime())) {
              updatedAt = parsed.toISOString();
            }
          }

          const url = buildAppUrl(name);

          apps.push({
            name,
            container: containerName,
            state,
            status,
            updatedAt,
            ...(url ? { url } : {}),
          });
        } catch (error) {
          console.warn("[deploy] failed to parse docker entry", line, error);
        }
      }

      resolve(apps);
    });
  });
}

async function runDockerCommand(
  args: string[],
  onOutput?: (text: string) => void,
  ignoreFailure = false
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("docker", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stdout.on("data", (buffer) => {
      const text = buffer.toString();
      if (onOutput) {
        onOutput(text);
      }
      console.log(`[docker ${args[0]}] ${text.trimEnd()}`);
    });
    child.stderr.on("data", (buffer) => {
      const text = buffer.toString();
      stderr += text;
      if (onOutput) {
        onOutput(text);
      }
      console.error(`[docker ${args[0]}] ${text.trimEnd()}`);
    });

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      if (code === 0 || ignoreFailure) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `docker ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

async function purgeDeployOutput(appName: string) {
  const root = resolveDeployRoot(process.env.DEPLOY_OUTPUT_DIR);
  const target = path.join(root, appName);
  await rm(target, { recursive: true, force: true });
}

function resolveDeployRoot(baseOutputDir?: string) {
  return baseOutputDir ? path.resolve(baseOutputDir) : path.join(process.cwd(), "deployments");
}

function buildAppUrl(name: string, overrideBase?: string) {
  const base = overrideBase ?? process.env.DEPLOY_BASE_URL;
  if (!base) return undefined;

  try {
    const normalized = base.endsWith("/") ? base : `${base}/`;
    return new URL(`${name}/`, normalized).toString();
  } catch (error) {
    console.warn("[deploy] invalid base URL", base, error);
    return undefined;
  }
}

async function ensureStaticContainer({
  containerName,
  bundleDir,
  network,
  onOutput,
}: {
  containerName: string;
  bundleDir: string;
  network?: string;
  onOutput: (text: string) => void;
}) {
  await runDockerCommandSafe(["rm", "-f", containerName]);

  const args = [
    "run",
    "-d",
    "--name",
    containerName,
    "--restart",
    "unless-stopped",
    "-v",
    `${bundleDir}:/usr/share/nginx/html:ro`,
  ];

  if (network) {
    args.push("--network", network);
  }

  args.push("nginx:alpine");

  onOutput(`$ docker ${args.join(" ")}\n`);
  await runDockerCommand(args, onOutput);
}

async function runDockerCommandSafe(args: string[]) {
  try {
    await runDockerCommand(args, undefined, true);
  } catch (error) {
    console.warn(`[deploy] docker ${args.join(" ")} failed (ignored):`, error);
  }
}

function normalizeContainerState(value?: string): ContainerState {
  const state = (value ?? "").toLowerCase();
  if (state.includes("running")) return "running";
  if (state.includes("restart")) return "restarting";
  return "exited";
}

function eventTimestamp(event: HistoryEvent) {
  if (event.kind === "deployment") {
    return new Date(event.startedAt);
  }
  return new Date(event.timestamp);
}

async function recordContainerAction({
  app,
  container,
  action,
  status,
  message,
}: {
  app: string;
  container: string;
  action: "start" | "stop" | "restart" | "remove";
  status: "success" | "failed";
  message?: string;
}) {
  const event: HistoryEvent = {
    kind: "container-action",
    id: crypto.randomUUID(),
    app,
    container,
    action,
    status,
    timestamp: new Date().toISOString(),
    ...(message ? { message } : {}),
  };
  try {
    await appendHistoryEvent(event);
  } catch (error) {
    console.error("[deploy] failed to append container action", error);
  }
}
