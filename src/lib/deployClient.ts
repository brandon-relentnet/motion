import type { DeployPayload } from "../stores/deployFormStore";
import type { DeployStep } from "../stores/deploySessionStore";

export const DEPLOY_STEP_MARKERS = [
  { key: "git" as const, find: "== Git clone/update ==" },
  { key: "build" as const, find: "== Build with Node (docker) ==" },
  { key: "publish" as const, find: "== Publish with Nginx ==" },
];

export type DeployStepKey = (typeof DEPLOY_STEP_MARKERS)[number]["key"];

export type DeployStreamCallbacks = {
  signal?: AbortSignal;
  onStep?: (step: DeployStepKey) => void;
  onChunk?: (chunk: string) => void;
  onCommit?: (commit: string) => void;
};

const DECODER = new TextDecoder();

export async function deployStream(
  payload: DeployPayload,
  callbacks: DeployStreamCallbacks = {}
): Promise<void> {
  const { signal, onStep, onChunk, onCommit } = callbacks;

  const response = await fetch("/api/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    const message = await safeReadText(response);
    throw new Error(message || `Deployment failed (HTTP ${response.status})`);
  }

  const reader = response.body.getReader();
  let buffer = "";
  let currentStep: DeployStep | "idle" = "idle";
  let commitCaptured = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = DECODER.decode(value, { stream: true });
    buffer += chunk;
    onChunk?.(chunk);

    for (const marker of DEPLOY_STEP_MARKERS) {
      if (buffer.includes(marker.find) && currentStep !== marker.key) {
        currentStep = marker.key;
        onStep?.(marker.key);
      }
    }

    if (!commitCaptured) {
      const commitLine = buffer
        .split("\n")
        .find((line) =>
          line.toLowerCase().startsWith("checked out commit:")
        );
      if (commitLine) {
        const commit = commitLine.split(":").pop()?.trim();
        if (commit) {
          commitCaptured = true;
          onCommit?.(commit);
        }
      }
    }
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch (error) {
    console.warn("[deploy] failed to read error body", error);
    return "";
  }
}
