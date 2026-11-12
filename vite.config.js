import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // La ruta relativa permite publicar el mismo build en cualquier repo de GitHub Pages.
  // HashRouter mantiene las rutas de la aplicación después del símbolo #.
  base: "./"
});
