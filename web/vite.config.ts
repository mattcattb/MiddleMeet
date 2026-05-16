import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import TanStackRouterVite from "@tanstack/router-plugin/vite";

import tailwindVite from "@tailwindcss/vite";

const previewAllowedHosts = process.env.VITE_PREVIEW_ALLOWED_HOSTS?.split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  envDir: "../..",
  preview: {
    allowedHosts: previewAllowedHosts,
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173,
  },
  plugins: [
    tailwindVite(),
    TanStackRouterVite({target: "react", autoCodeSplitting: true}),
    react(),
  ],
});
