import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { ServerResponse } from "node:http";
import path from "node:path";
import { isScanning, listDevices, radioAvailable, startScan, stopScan } from "./server/bleRadio.ts";

function send(res: ServerResponse, body: unknown) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

/** Radio BlueZ de la machine de dev. Absent de `vite preview` et des tests. */
function bleDevPlugin(): Plugin {
  return {
    name: "pulsar-ble",
    configureServer(server) {
      server.httpServer?.on("close", () => stopScan());
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];
        if (url === "/__ble/status" && req.method === "GET") {
          send(res, { ok: radioAvailable(), scanning: isScanning() });
          return;
        }
        if (url === "/__ble/devices" && req.method === "GET") {
          send(res, { devices: listDevices(), scanning: isScanning() });
          return;
        }
        if (url === "/__ble/start" && req.method === "POST") {
          void startScan().then((result) => send(res, result));
          return;
        }
        if (url === "/__ble/stop" && req.method === "POST") {
          stopScan();
          send(res, { ok: true });
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), bleDevPlugin()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  optimizeDeps: { include: ["three", "@react-three/fiber", "@react-three/drei"] },
  server: { port: 5173, strictPort: false },
  preview: { port: 4173 },
  // three.js (~1 Mo) n’est chargé qu’à l’affichage de la silhouette 3D (import dynamique dans BodyFigure).
  build: { chunkSizeWarningLimit: 1200 },
});
