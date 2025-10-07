export const THEMES = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "retro";

export const normalizeTheme = (value?: string | null): Theme =>
  value && THEMES.includes(value as Theme) ? (value as Theme) : DEFAULT_THEME;

export const readThemePreference = (): Theme => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return normalizeTheme(window.localStorage.getItem("theme"));
};

export const persistThemePreference = (theme: Theme) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("theme", theme);
};

export const applyThemePreference = (theme: Theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
};

export const THEME_COLORS: Record<
  (typeof THEMES)[number],
  [string, string, string, string]
> = {
  light: ["#f5f5f5", "#857de0", "#e898be", "#d5cdd8"],
  dark: ["#191c22", "#6364c4", "#914a6f", "#624e60"],
  cupcake: ["#ebe7e4", "#98d8cd", "#d7a79e", "#c9b09a"],
  bumblebee: ["#f8e270", "#d68b1a", "#1f1b17", "#1e1d1b"],
  emerald: ["#eae9e6", "#4d7ee3", "#6aa87e", "#3b3a3b"],

  corporate: ["#e7eaec", "#2d7ad2", "#6cc9ce", "#364a5a"],
  synthwave: ["#0f0e29", "#a1489d", "#5a97e6", "#6961b8"],
  retro: ["#e9ddc8", "#d16c51", "#a98446", "#4aa084"],
  cyberpunk: ["#efe07b", "#cf3a49", "#2099b5", "#2f2a5b"],
  valentine: ["#f5d5df", "#d24a86", "#c775a6", "#6e87b1"],

  halloween: ["#18110a", "#d98f1b", "#73b34c", "#7a653f"],
  garden: ["#e9e9e6", "#d65e62", "#a9c28b", "#5f5f4c"],
  forest: ["#1b150f", "#2c8f42", "#3aa06d", "#2e7776"],
  aqua: ["#25366a", "#8bd6ea", "#5689d6", "#2e3c74"],
  lofi: ["#f6f6f6", "#0b0b0b", "#181818", "#1e1e1e"],

  pastel: ["#f1f0ef", "#d29cd4", "#e4c8c4", "#9cd8c4"],
  fantasy: ["#e8e8ea", "#8b3a7f", "#d87528", "#3c5c8a"],
  wireframe: ["#efefef", "#2b2a29", "#464543", "#bcbab6"],
  black: ["#0a0a0a", "#2a2a2a", "#464646", "#8a8a8a"],
  luxury: ["#191312", "#3170ad", "#5a3c2a", "#9f7c52"],

  dracula: ["#201b1d", "#d85a58", "#b07a2d", "#b9c0cb"],
  cmyk: ["#e8ecef", "#2aa0e2", "#e05aa3", "#f1cd39"],
  autumn: ["#e5dbcf", "#a54a3a", "#9a6e46", "#756655"],
  business: ["#2a2320", "#4a6987", "#87a2b5", "#9d725b"],
  acid: ["#f1f1f1", "#d4553b", "#8a34cf", "#a2c121"],

  lemonade: ["#e6ebdc", "#4a7f2d", "#cfa614", "#5f6d34"],
  night: ["#151a2a", "#0e63a7", "#5d2f64", "#c988b0"],
  coffee: ["#2b2220", "#b0762a", "#334c59", "#4a6a7b"],
  winter: ["#f0f2f7", "#3c53e8", "#6a4bd0", "#3b2a44"],
  dim: ["#25272c", "#e17f3a", "#619b53", "#6b5596"],

  nord: ["#e6e7e8", "#2f4a68", "#446989", "#5e6c7b"],
  sunset: ["#15151a", "#c55134", "#614a9b", "#5e5d8f"],
  caramellatte: ["#e9dfcf", "#2b201a", "#2f130c", "#826859"],
  abyss: ["#030b15", "#add545", "#8988aa", "#80809f"],
  silk: ["#e4e0dc", "#4b5231", "#66656d", "#68666c"],
};
