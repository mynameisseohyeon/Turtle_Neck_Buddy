import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: new URL("./popup.html", import.meta.url).pathname,
        background: new URL("./src/background/index.ts", import.meta.url).pathname,
        overlay: new URL("./src/content/overlayRoot.ts", import.meta.url).pathname
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }

          if (chunkInfo.name === "overlay") {
            return "content/overlay.js";
          }

          return "assets/[name]-[hash].js";
        }
      }
    }
  }
});
