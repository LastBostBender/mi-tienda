import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { writeFileSync, mkdirSync, readFileSync, unlinkSync, copyFileSync } from "fs";

// GitHub Pages publica dist; copia allí los dos archivos gráficos que están en la raíz.
function copyBrandAssets() {
  return {
    name: "copy-brand-assets",
    closeBundle() {
      const root = resolve(__dirname);
      const dist = resolve(__dirname, "dist");
      for (const file of ["icon.png", "icon-icon.png"]) {
        copyFileSync(resolve(root, file), resolve(dist, file));
      }
    },
  };
}

// Mueve dist/index-admin.html → dist/admin/index.html y corrige rutas relativas.
function moveAdminHtml() {
  return {
    name: "move-admin-html",
    closeBundle() {
      try {
        const src = resolve(__dirname, "dist/index-admin.html");
        const destDir = resolve(__dirname, "dist/admin");
        const dest = resolve(destDir, "index.html");
        mkdirSync(destDir, { recursive: true });
        let html = readFileSync(src, "utf-8");
        html = html
          .replace(/src="\.\/admin\/assets\//g, 'src="./assets/')
          .replace(/href="\.\/admin\/assets\//g, 'href="./assets/')
          .replace(/href="\.\/assets\//g, 'href="../assets/')
          .replace(/src="\.\/assets\//g, 'src="../assets/');
        writeFileSync(dest, html);
        unlinkSync(src);
      } catch (e) {
        console.warn("move-admin-html:", e.message);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), moveAdminHtml(), copyBrandAssets()],
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "index-admin.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
