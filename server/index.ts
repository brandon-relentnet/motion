import cors from "cors";
import express from "express";

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
  const { name, repoUrl, framework, appPath } = req.body ?? {};
  if (!name || !repoUrl) {
    return res.status(400).json({ error: "Both name and repoUrl are required." });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  const safeWrite = (message: string) => {
    if (!aborted) {
      res.write(message);
    }
  };

  safeWrite(`Starting deployment for ${name}\n`);
  safeWrite(`Repository: ${repoUrl}\n`);
  if (framework) safeWrite(`Framework: ${framework}\n`);
  if (appPath) safeWrite(`App Path: ${appPath}\n`);

  const commitHash = randomCommit();
  const stages = [
    {
      marker: "== Git clone/update ==",
      logs: [`Cloning repository...`, `Checked out commit: ${commitHash}`],
    },
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

function randomCommit() {
  return Math.random().toString(16).slice(2, 9).padEnd(7, "0");
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
