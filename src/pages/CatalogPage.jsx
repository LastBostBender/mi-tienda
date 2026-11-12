import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductsContext";

export default function CatalogPage() {
  const { products, status, error, reload } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const categories = useMemo(() =>
    [...new Set(products.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  [products]);

  const filtered = products.filter((p) =>
    p.nombre.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
    (category === "Todas" || p.categoria === category)
  );

  if (status === "loading") return <div className="state-message">Cargando catálogo…</div>;
  if (status === "error") return (
    <section className="state-message">
      <h1>No se pudo cargar el catálogo</h1>
      <p>{error}</p>
      <button className="button button-primary" onClick={reload}>Reintentar</button>
    </section>
  );

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">Explora nuestros productos</p><h1>Catálogo</h1></div>
      </div>
      <div className="catalog-tools">
        <label className="field">
          <span>Buscar por nombre</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="¿Qué estás buscando?" />
        </label>
        <label className="field">
          <span>Categoría</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Todas">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      {products.length === 0 ? (
        <div className="state-message"><h2>Catálogo vacío</h2><p>No hay productos activos publicados en la hoja.</p></div>
      ) : filtered.length === 0 ? (
        <div className="state-message">No hay productos que coincidan con la búsqueda.</div>
      ) : (
        <div className="product-grid">{filtered.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </section>
  );
}
