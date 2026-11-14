import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";

const NOMBRE_TIENDA = "Mi Tienda";
const SLOGAN = "Catálogo y pedidos online";
// const LOGO_URL = "/logo.svg";

/* ── Tema ─────────────────────────────────────────────────── */
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("tienda-theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("tienda-theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);
  return [dark, () => setDark(d => !d)];
}

/* ── Splash ──────────────────────────────────────────────── */
function Splash({ onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (ref.current) {
        ref.current.style.opacity = "0";
        setTimeout(onDone, 500);
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="splash" ref={ref}>
      <div className="splash-content">
        {/* Swap por <img className="splash-logo" src={LOGO_URL} /> si tienes logo */}
        <span className="splash-icon">🛍️</span>
        <div>
          <div className="splash-name">{NOMBRE_TIENDA}</div>
          <div className="splash-slogan">{SLOGAN}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Catálogo ────────────────────────────────────────────── */
export default function CatalogPage() {
  const { products, status, error, reload } = useProducts();
  const { itemCount } = useCart();
  const [dark, toggleDark] = useDarkMode();
  const [splash, setSplash] = useState(() => {
    try { return !sessionStorage.getItem("tienda-splash"); } catch { return true; }
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hideSplash = useCallback(() => {
    try { sessionStorage.setItem("tienda-splash", "1"); } catch {}
    setSplash(false);
  }, []);

  const categories = useMemo(
    () => ["Todas", ...[...new Set(products.map(p => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b))],
    [products]
  );

  const filtered = useMemo(() =>
    products.filter(p =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) &&
      (category === "Todas" || p.categoria === category)
    ), [products, search, category]
  );

  const byCategory = useMemo(() => {
    if (search || category !== "Todas") return null;
    const map = new Map();
    products.forEach(p => {
      const cat = p.categoria || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(p);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [products, search, category]);

  if (status === "loading") return (
    <div className="skeleton-grid">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
    </div>
  );

  if (status === "error") return (
    <section className="state-message">
      <h1>No se pudo cargar el catálogo</h1>
      <p>{error}</p>
      <button className="button button-primary" onClick={reload}>Reintentar</button>
    </section>
  );

  return (
    <>
      {splash && <Splash onDone={hideSplash} />}

      {/* Categorías sticky */}
      <nav className="categorias-nav" aria-label="Filtrar por categoría">
        <div className="container">
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn-categoria${category === cat ? " active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <section>
        <div className="catalog-tools" style={{ marginTop: "1.2rem" }}>
          <label className="field">
            <span>Buscar</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="¿Qué estás buscando?" />
          </label>
        </div>

        {!products.length ? (
          <div className="state-message"><h2>Catálogo vacío</h2><p>No hay productos publicados.</p></div>
        ) : !filtered.length ? (
          <div className="state-message">No hay coincidencias.</div>
        ) : byCategory ? (
          <div className="catalogo-categorias">
            {byCategory.map(([cat, prods]) => (
              <div key={cat}>
                <h2 className="catalogo-categoria-titulo">📦 {cat}</h2>
                <div className="productos-fila">
                  {prods.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* FABs */}
      <div className="fab-container">
        <button
          className="fab-btn"
          style={{ background: "var(--bg-surface)", color: "var(--text-main)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}
          onClick={toggleDark}
          aria-label="Cambiar tema"
        >
          {dark ? "☀️" : "🌙"}
        </button>
        <button className="fab-btn" aria-label="Ver carrito" onClick={() => setDrawerOpen(true)}>
          🛒
          {itemCount > 0 && <span className="fab-badge">{itemCount}</span>}
        </button>
      </div>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
