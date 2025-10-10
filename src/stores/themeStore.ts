import { create } from "zustand";
import {
  applyThemePreference,
  normalizeTheme,
  persistThemePreference,
  readThemePreference,
  animateThemeChange,
  type Theme,
} from "../lib/themes";

const initialTheme = readThemePreference();
if (typeof document !== "undefined") {
  applyThemePreference(initialTheme);
}

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (next) => {
    const normalized = normalizeTheme(next);
    if (normalized === get().theme) return;
    animateThemeChange(() => applyThemePreference(normalized));
    persistThemePreference(normalized);
    set({ theme: normalized });
  },
}));
