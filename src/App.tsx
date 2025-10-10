import { useEffect, useState, type ChangeEvent } from "react";
import SmoothTabs from "./components/SmoothTabs";
import UsePresenceData from "./components/UsePresence";
import { useContainersStore } from "./stores/containersStore";
import {
  applyThemePreference,
  persistThemePreference,
  readThemePreference,
  normalizeTheme,
  THEMES,
  type Theme,
} from "./lib/themes";

export default function App() {
  const fetchApps = useContainersStore((state) => state.fetchApps);

  useEffect(() => {
    void fetchApps();
  }, [fetchApps]);

  return (
    <div className="px-8 min-h-screen flex flex-col items-center gap-6 py-6">
      <header className="w-full max-w-[1600px] flex justify-end">
        <ThemeDropdown />
      </header>
      <div className="lg:flex-row flex flex-col gap-8 w-full justify-center items-center max-w-[1600px]">
        <div className="lg:w-1/3 w-full">
          <UsePresenceData />
        </div>

        <div className="lg:w-2/3 w-full">
          <SmoothTabs />
        </div>
      </div>
    </div>
  );
}

function ThemeDropdown() {
  const [theme, setTheme] = useState<Theme>(() => readThemePreference());

  useEffect(() => {
    applyThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    const stored = readThemePreference();
    setTheme(stored);
    applyThemePreference(stored);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextTheme = normalizeTheme(event.target.value);
    setTheme(nextTheme);
    applyThemePreference(nextTheme);
    persistThemePreference(nextTheme);
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-base-content/70">Theme</span>
      <select
        className="select select-sm"
        value={theme}
        onChange={handleChange}
      >
        {THEMES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
