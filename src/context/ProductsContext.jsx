import { createContext, useContext, useEffect, useState } from "react";
import Papa from "papaparse";
import { CONFIG } from "../config";

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function loadProducts() {
    setStatus("loading");
    setError("");
    try {
      if (!CONFIG.CSV_URL || CONFIG.CSV_URL.includes("[PEGAR_")) {
        throw new Error("Configura CSV_URL en src/config.js antes de cargar el catálogo.");
      }
      const response = await fetch(CONFIG.CSV_URL);
      if (!response.ok) throw new Error(`No se pudo leer el catálogo (HTTP ${response.status}).`);
      const csvText = await response.text();
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      if (parsed.errors.length) {
        console.warn("Advertencias al interpretar CSV:", parsed.errors);
      }

      const normalized = parsed.data
        .filter((row) => String(row.activo ?? "").trim().toUpperCase() === "TRUE")
        .map((row) => ({
          id: String(row.id ?? "").trim(),
          nombre: String(row.nombre ?? "").trim(),
          descripcion: String(row.descripcion ?? "").trim(),
          precio: Number(String(row.precio ?? "").replace(",", ".")),
          imagen_url: String(row.imagen_url ?? "").trim(),
          categoria: String(row.categoria ?? "").trim()
        }))
        .filter((product) => product.id && product.nombre && Number.isFinite(product.precio));

      setProducts(normalized);
      setStatus("success");
    } catch (err) {
      setError(err.message || "Ocurrió un error al cargar el catálogo.");
      setStatus("error");
    }
  }

  useEffect(() => { loadProducts(); }, []);

  return (
    <ProductsContext.Provider value={{ products, status, error, reload: loadProducts }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProducts debe utilizarse dentro de ProductsProvider");
  return context;
}
