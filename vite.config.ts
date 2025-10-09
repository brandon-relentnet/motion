import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
  ],
  server: {
    port: 3000,
    proxy: createProxyConfig(),
  },
  preview: {
    port: 4173,
  },
});

function createProxyConfig() {
  const target = process.env.API_URL ?? "http://localhost:4000";
  return {
    "/api": {
      target,
      changeOrigin: true,
    },
    "/healthz": {
      target,
      changeOrigin: true,
    },
  } satisfies Record<string, { target: string; changeOrigin: boolean }>;
}
