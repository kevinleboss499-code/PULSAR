import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  optimizeDeps: { include: ["three", "@react-three/fiber", "@react-three/drei"] },
  server: { port: 5173, strictPort: false },
  preview: { port: 4173 },
  // three.js (~1 Mo) n’est chargé qu’à l’affichage de la silhouette 3D (import dynamique dans BodyFigure).
  build: { chunkSizeWarningLimit: 1200 },
});
