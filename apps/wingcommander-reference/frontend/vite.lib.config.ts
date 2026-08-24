import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Library build for src/components/ui — separate from the app build (vite.config.ts).
// Produces dist-lib/index.es.js for tooling that consumes these components as a package
// (e.g. design-system sync), without affecting the deployed app bundle.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-lib",
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "./src/index.ts"),
      formats: ["es"],
      fileName: () => "index.es.js",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        /^@radix-ui\//,
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "lucide-react",
      ],
    },
  },
});
