import { useEffect, useState } from "react";
import {
  THEMES,
  applyThemePreference,
  normalizeTheme,
  persistThemePreference,
  readThemePreference,
} from "../lib/themes";
import type { Theme } from "../lib/themes";

export default function Theme() {
  const [theme, setTheme] = useState<Theme>(readThemePreference);

  // Persist and apply to <html data-theme="...">
  useEffect(() => {
    persistThemePreference(theme);
    applyThemePreference(theme);
  }, [theme]);

  return (
    <div className="flex items-start">
      <div className="dropdown ">
        <div tabIndex={0} role="button" className="btn m-1">
          Theme
          <svg
            width="12"
            height="12"
            className="inline-block h-2 w-2 fill-current opacity-60"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 2048 2048"
          >
            <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
          </svg>
        </div>

        <ul
          tabIndex={0}
          className="dropdown-content p-2 w-52 h-72 rounded-box overflow-auto z-[50] bg-base-300 shadow-2xl"
        >
          {THEMES.map((t) => (
            <li key={t}>
              <label className="w-full">
                <input
                  type="radio"
                  name="theme-dropdown"
                  className={`theme-controller btn btn-sm btn-block justify-start ${theme === t ? "" : "btn-ghost"}`}
                  aria-label={t.charAt(0).toUpperCase() + t.slice(1)}
                  value={t}
                  checked={theme === t}
                  onChange={(e) => setTheme(normalizeTheme(e.currentTarget.value))}
                />
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
