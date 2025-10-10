import { useEffect, useRef, useState } from "react";
import SmoothTabs from "./components/SmoothTabs";
import UsePresenceData from "./components/UsePresence";
import { useContainersStore } from "./stores/containersStore";
import { useThemeStore } from "./stores/themeStore";
import { THEMES } from "./lib/themes";

export default function App() {
  const fetchApps = useContainersStore((state) => state.fetchApps);

  useEffect(() => {
    void fetchApps();
  }, [fetchApps]);

  return (
    <div className="px-8 min-h-screen flex flex-col items-center justify-center gap-6 py-6">
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
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-sm btn-ghost gap-2"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span aria-hidden>🎨</span>
        <span className="hidden sm:inline text-sm">{theme}</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto rounded-box border border-base-300/70 bg-base-200 shadow-lg z-50"
        >
          <ul className="menu menu-sm">
            {THEMES.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className={`justify-between ${item === theme ? "active" : ""}`}
                  onClick={() => {
                    setTheme(item);
                    setOpen(false);
                  }}
                >
                  <span>{item}</span>
                  {item === theme ? <span className="badge badge-primary badge-xs">active</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
