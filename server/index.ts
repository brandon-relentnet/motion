import cors from "cors";
import express from "express";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

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
}

const apps: AppInfo[] = [
  {
    name: "landing",
    container: "static_landing",
    state: "running",
    status: "Up 3 hours",
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    name: "docs",
    container: "static_docs",
    state: "exited",
    status: "Exited (0) 2 days ago",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api/apps", (_req, res) => {
  res.json({ apps });
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

  req.on("close", () => {
    aborted = true;
    activeProcess?.kill("SIGTERM");
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

  try {
    safeWrite("== Git clone/update ==\n");
    const { commit } = await runGitClone({
      repoUrl,
      branch,
      destination: workspaceRoot,
      onProcess: (child) => {
        activeProcess = child;
      },
      onOutput: safeWrite,
    });

    safeWrite(`Checked out commit: ${commit}\n`);

    const stages = [
      {
        marker: "== Build with Node (docker) ==",
        logs: [`Installing dependencies...`, `Running build script...`],
      },
      {
        marker: "== Publish with Nginx ==",
        logs: [`Uploading assets...`, `Reloading container...`],
      },
    ];

    for (const stage of stages) {
      if (aborted) break;
      safeWrite(`${stage.marker}\n`);
      for (const line of stage.logs) {
        if (aborted) break;
        safeWrite(`${line}\n`);
        await sleep(600);
      }
      await sleep(400);
    }

    if (aborted) {
      safeWrite("Deployment cancelled by client.\n");
      return res.end();
    }

    upsertApp({
      name,
      container: `static_${name}`,
      state: "running",
      status: "Up just now",
    });

    safeWrite("Deployment complete.\n");
    res.end();
  } catch (error) {
    console.error("[deploy] deploy failed", error);
    const message = error instanceof Error ? error.message : String(error);
    safeWrite(`Deployment failed: ${message}\n`);
    res.destroy(new Error(message));
  } finally {
    activeProcess?.kill("SIGTERM");
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

app.post("/api/containers/:container/action", (req, res) => {
  const container = String(req.params.container);
  const { action, purge } = req.body ?? {};
  const app = apps.find((item) => item.container === container);

  if (!app) {
    return res.status(404).json({ error: `Container ${container} not found.` });
  }

  switch (action) {
    case "start":
      app.state = "running";
      app.status = "Up just now";
      break;
    case "stop":
      app.state = "exited";
      app.status = "Exited (0) just now";
      break;
    case "restart":
      app.state = "restarting";
      app.status = "Restarting...";
      setTimeout(() => {
        app.state = "running";
        app.status = "Up just now";
        app.updatedAt = new Date().toISOString();
      }, 1000);
      break;
    case "remove":
      removeApp(container);
      if (purge) {
        console.info(`Purging app files for ${container}`);
      }
      return res.json({ ok: true, removed: true, purged: Boolean(purge) });
    default:
      return res.status(400).json({ error: `Unknown action ${action}` });
  }

  app.updatedAt = new Date().toISOString();
  res.json({ ok: true, app });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function upsertApp({
  name,
  container,
  state,
  status,
}: {
  name: string;
  container: string;
  state: ContainerState;
  status: string;
}) {
  const existing = apps.find((item) => item.name === name);
  if (existing) {
    existing.state = state;
    existing.status = status;
    existing.container = container;
    existing.updatedAt = new Date().toISOString();
  } else {
    apps.push({
      name,
      container,
      state,
      status,
      updatedAt: new Date().toISOString(),
    });
  }
}

function removeApp(container: string) {
  const index = apps.findIndex((item) => item.container === container);
  if (index >= 0) {
    apps.splice(index, 1);
  }
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
