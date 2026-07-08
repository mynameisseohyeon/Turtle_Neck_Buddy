import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "emit-extension-manifest",
      generateBundle: function () {
        this.emitFile({
          type: "asset",
          fileName: "manifest.json",
          source: JSON.stringify(manifest, null, 2)
        });
      }
    }
  ],
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
