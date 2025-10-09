import { useEffect, useMemo, useState } from "react";
import {
  selectApps,
  selectSelectedApp,
  useContainersStore,
} from "../stores/containersStore";
import {
  useAppSettingsStore,
  selectSettingsError,
  selectSettingsLoading,
} from "../stores/appSettingsStore";
import type { AppInfo } from "../types/app";
import type { AppSettings } from "../types/settings";
import { envObjectToText, textToEnv } from "../lib/env";

const emptySettings: AppSettings = {
  app: "",
  notes: "",
  owner: "",
  domain: undefined,
};

export default function ContainerSettingsPanel() {
  const selectedApp = useContainersStore(selectSelectedApp);
  const apps = useContainersStore(selectApps);
  const fetchSettings = useAppSettingsStore((state) => state.fetchSettings);
  const saveSettings = useAppSettingsStore((state) => state.saveSettings);
  const deleteSettings = useAppSettingsStore((state) => state.deleteSettings);
  const loading = useAppSettingsStore(selectSettingsLoading);
  const error = useAppSettingsStore(selectSettingsError);

  const containerInfo = useMemo(() => {
    if (!selectedApp) return null;
    return apps.find((app) => app.name === selectedApp) ?? null;
  }, [apps, selectedApp]);

  const [form, setForm] = useState<AppSettings>(emptySettings);
  const [publicEnvText, setPublicEnvText] = useState("");
  const [secretsText, setSecretsText] = useState("");
  const [domain, setDomain] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedApp) {
      setForm(emptySettings);
      setPublicEnvText("");
      setSecretsText("");
      setStatusMessage(null);
      setDomain("");
      return;
    }

    setStatusMessage(null);
    const app = selectedApp;
    void fetchSettings(app)
      .then((settings) => {
        if (!settings) {
        setForm({ ...emptySettings, app });
        setPublicEnvText("");
        setSecretsText("");
        setDomain("");
        return;
      }
      setForm(settings);
      setPublicEnvText(envObjectToText(settings.publicEnv));
      setSecretsText(envObjectToText(settings.secrets));
      setDomain(settings.domain ?? "");
      })
      .catch(() => {
        /* handled via error state */
      });
  }, [fetchSettings, selectedApp]);

  if (!selectedApp) {
    return (
      <div className="card w-full p-6">
        <h3 className="font-bold text-lg">Select a container</h3>
        <p className="text-sm text-base-content/70 mt-2">
          Choose a container on the right to view and edit its settings.
        </p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    try {
      const saved = await saveSettings(selectedApp, {
        notes: form.notes,
        owner: form.owner,
        publicEnv: textToEnv(publicEnvText),
        secrets: textToEnv(secretsText),
        domain,
      });
      setForm(saved);
      setPublicEnvText(envObjectToText(saved.publicEnv));
      setSecretsText(envObjectToText(saved.secrets));
      setDomain(saved.domain ?? "");
      setStatusMessage("Settings saved.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete saved settings for ${selectedApp}?`)) return;
    try {
      await deleteSettings(selectedApp);
      setForm({ ...emptySettings, app: selectedApp });
      setPublicEnvText("");
      setSecretsText("");
      setDomain("");
      setStatusMessage("Settings deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card w-full p-6 flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">Settings • {selectedApp}</h3>
        {containerInfo && (
          <ContainerMeta info={containerInfo} settings={form} domain={domain} />
        )}
      </header>

      <form className="space-y-4" onSubmit={handleSubmit}>
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

        <div className="form-control">
          <label className="label">
            <span className="label-text">Domain</span>
          </label>
          <input
            className="input input-bordered"
            placeholder="https://app.example.com"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          />
          <label className="label">
            <span className="label-text-alt">Used for allowlists and links.</span>
          </label>
        </div>

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

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete Settings
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ContainerMeta({
  info,
  settings,
  domain,
}: {
  info: AppInfo;
  settings: AppSettings;
  domain?: string;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm text-base-content/70">
      <span>
        Status: <span className="font-medium">{info.state}</span> • {info.status}
      </span>
      <span>Container ID: {info.container}</span>
      <span>Domain: {domain?.trim() || "—"}</span>
      {settings.repoUrl && (
        <span className="truncate">
          Repo: <span className="text-base-content/80">{settings.repoUrl}</span>
        </span>
      )}
      {settings.branch && (
        <span>
          Branch: <span className="text-base-content/80">{settings.branch}</span>
        </span>
      )}
      {settings.lastDeployedAt && (
        <span>
          Last deploy: {formatTimestamp(settings.lastDeployedAt)}
        </span>
      )}
      {settings.lastCommit && (
        <span>
          Last commit: <code>{settings.lastCommit.slice(0, 7)}</code>
        </span>
      )}
      {info.url && (
        <a href={info.url} target="_blank" rel="noreferrer" className="link link-hover">
          {info.url}
        </a>
      )}
    </div>
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

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
