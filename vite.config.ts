import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "three";
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id))
            return "react";
        },
      },
    },
  },
  server: {
    port: 5178,
    strictPort: true,
    watch: {
      ignored: ["**/work/**", "**/test-results/**", "**/playwright-report/**"],
    },
  },
});
