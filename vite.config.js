import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { writeFileSync, mkdirSync, readFileSync, unlinkSync } from "fs";

// Plugin que mueve dist/index-admin.html → dist/admin/index.html después del build
// y corrige las rutas relativas para que funcionen desde el subdirectorio /admin/.
function moveAdminHtml() {
  return {
    name: "move-admin-html",
    closeBundle() {
      try {
        const src = resolve(__dirname, "dist/index-admin.html");
        const destDir = resolve(__dirname, "dist/admin");
        const dest = resolve(destDir, "index.html");
        mkdirSync(destDir, { recursive: true });
        // Reemplaza "./assets/" y "./admin/assets/" → "../assets/" y "./assets/"
        // para que los paths sean correctos desde /admin/index.html
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

// Build multi-entry: la tienda se publica en la raíz y el panel de administración
// en el subdirectorio /admin. Ambos usan HashRouter para funcionar en GitHub Pages.
export default defineConfig({
  plugins: [react(), moveAdminHtml()],
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "index-admin.html"),
      },
      output: {
        // Todos los JS (tienda y admin) van en assets/ raíz para simplificar las rutas.
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
