import { useEffect, useState } from "react";

const THEMES = ["retro", "cyberpunk", "valentine", "aqua", "scrollr"] as const;
type Theme = (typeof THEMES)[number];

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "retro";
    const stored = localStorage.getItem("theme");
    return stored && THEMES.includes(stored as Theme)
      ? (stored as Theme)
      : "retro";
  });

  // Persist and apply to <html data-theme="...">
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="flex items-start">
      <div className="dropdown">
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
          className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl"
        >
          {THEMES.map((t) => (
            <li key={t}>
              <label className="w-full">
                <input
                  type="radio"
                  name="theme-dropdown"
                  className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                  aria-label={t.charAt(0).toUpperCase() + t.slice(1)}
                  value={t}
                  checked={theme === t}
                  onChange={(e) => setTheme(e.currentTarget.value as Theme)}
                />
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
