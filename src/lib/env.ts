export function envObjectToText(env?: Record<string, string>): string {
  if (!env) return "";
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function textToEnv(text: string): Record<string, string> | undefined {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return undefined;
  const result: Record<string, string> = {};
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (!key) continue;
    result[key.trim()] = rest.join("=").trim();
  }
  return Object.keys(result).length ? result : undefined;
}
