import { useEffect, useMemo, useState } from "react";
import {
  selectSettingsError,
  selectSettingsLoading,
  useAppSettingsStore,
} from "../stores/appSettingsStore";
import type { AppSettings } from "../types/settings";

const emptySettings: AppSettings = {
  app: "",
  notes: "",
  owner: "",
  publicEnv: undefined,
  secrets: undefined,
};

export default function AppSettingsModal({
  app,
  onClose,
}: {
  app: string | null;
  onClose: () => void;
}) {
  const visible = Boolean(app);
  const fetchSettings = useAppSettingsStore((state) => state.fetchSettings);
  const saveSettings = useAppSettingsStore((state) => state.saveSettings);
  const deleteSettings = useAppSettingsStore((state) => state.deleteSettings);
  const loading = useAppSettingsStore(selectSettingsLoading);
  const error = useAppSettingsStore(selectSettingsError);

  const [form, setForm] = useState<AppSettings>(emptySettings);
  const [publicEnvText, setPublicEnvText] = useState("");
  const [secretsText, setSecretsText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!app) return;
    setStatusMessage(null);
    setForm({ ...emptySettings, app });
    setPublicEnvText("");
    setSecretsText("");
    void fetchSettings(app)
      .then((settings) => {
        if (!settings) {
          setForm({ ...emptySettings, app });
          setPublicEnvText("");
          setSecretsText("");
          return;
        }
        setForm(settings);
        setPublicEnvText(formatEnv(settings.publicEnv));
        setSecretsText(formatEnv(settings.secrets));
      })
      .catch(() => {
        /* error handled in store */
      });
  }, [app, fetchSettings]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!app) return;
    setStatusMessage(null);

    const payload = {
      notes: form.notes,
      owner: form.owner,
      publicEnv: parseEnv(publicEnvText),
      secrets: parseEnv(secretsText),
    };

    try {
      await saveSettings(app, payload);
      setStatusMessage("Settings saved.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!app) return;
    if (!confirm(`Delete saved settings for ${app}?`)) return;
    try {
      await deleteSettings(app);
      setStatusMessage("Settings deleted.");
      setForm({ ...emptySettings, app });
      setPublicEnvText("");
      setSecretsText("");
    } catch (err) {
      console.error(err);
    }
  };

  const modalClass = useMemo(
    () =>
      `modal ${visible ? "modal-open" : ""}`,
    [visible]
  );

  return (
    <dialog className={modalClass} onClose={onClose}>
      <form method="dialog" className="modal-box max-w-2xl" onSubmit={handleSubmit}>
        <h3 className="font-bold text-lg">App Settings {app ? `• ${app}` : ""}</h3>

        <div className="space-y-4 mt-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Owner</span>
            </label>
            <input
              className="input input-bordered"
              value={form.owner ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, owner: event.target.value }))
              }
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Notes</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24"
              value={form.notes ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </div>

          <EnvEditor
            label="Public Build Env (VITE_ keys)"
            placeholder={`VITE_API_URL=https://example.com\nVITE_FLAG=true`}
            value={publicEnvText}
            onChange={setPublicEnvText}
          />

          <EnvEditor
            label="Secrets (stored server-side)"
            placeholder={`API_TOKEN=xxxx\nANOTHER=value`}
            value={secretsText}
            onChange={setSecretsText}
          />

          {error && (
            <div className="alert alert-error">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          )}
          {statusMessage && (
            <div className="alert alert-success">
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        <div className="modal-action">
          {form.app && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Settings
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Save"}
          </button>
        </div>
      </form>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}

function EnvEditor({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <textarea
        className="textarea textarea-bordered h-32 font-mono"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function formatEnv(env?: Record<string, string>) {
  if (!env) return "";
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function parseEnv(text: string) {
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
