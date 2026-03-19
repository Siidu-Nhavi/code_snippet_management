import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function resolveProxyTarget(env: Record<string, string>): string {
  const configuredTarget = env.VITE_PROXY_TARGET?.trim();

  if (configuredTarget) {
    return configuredTarget;
  }

  const configuredApiUrl = env.VITE_API_URL?.trim();

  if (configuredApiUrl) {
    try {
      return new URL(configuredApiUrl).origin;
    } catch {
      // Fall back to the local API target if the configured URL is not absolute.
    }
  }

  return "http://127.0.0.1:4001";
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: resolveProxyTarget(env),
          changeOrigin: true
        }
      }
    }
  };
});
