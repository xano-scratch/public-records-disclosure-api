import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite's root is the frontend/ folder, so index.html and the app live there
// while the XanoTS backend sits in xano/ as a peer. The build lands in
// frontend/dist, which `npm run xano:deploy` ships as the static frontend.
export default defineConfig({
  root: "frontend",
  // Vite resolves `.env` files against `root`, which is frontend/ here — but
  // `.env.example` sits at the project root, so that is where anyone will
  // actually put their `.env.local`. Point envDir back at this file's own
  // directory so VITE_XANO_HOST is picked up in dev.
  envDir: fileURLToPath(new URL(".", import.meta.url)),
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Split the vendor runtime off the app so no single chunk carries everything.
    // In Vite 8 manualChunks must be a function.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router")) return "router";
          if (id.includes("@radix-ui") || id.includes("radix-ui")) return "radix";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) return "react";
          return "vendor";
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // The alias the UI kit writes its imports against. Resolved from this
      // file rather than from Vite's root so it points at the right directory
      // either way. Keep in sync with the `paths` entry in tsconfig.json.
      "@": fileURLToPath(new URL("./frontend/src", import.meta.url)),
    },
  },
  server: { host: "127.0.0.1", port: 5173 },
});
