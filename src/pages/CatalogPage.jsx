import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import SubscribeForm from "../components/SubscribeForm";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Moon, Sun, Store } from "lucide-react";

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
        <span className="splash-icon">🛍️</span>
        <div>
          <div className="splash-name">Mi Tienda</div>
          <div className="splash-slogan">Catálogo y pedidos online</div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const { products, status, error, reload } = useProducts();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();
  const [splash, setSplash] = useState(() => {
    try { return !sessionStorage.getItem("tienda-splash"); } catch { return true; }
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const hideSplash = () => {
    try { sessionStorage.setItem("tienda-splash", "1"); } catch {}
    setSplash(false);
  };

  const categories = useMemo(
    () => ["Todas", ...[...new Set(products.map(p => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b))],
    [products]
  );

  const filtered = products.filter(
    p => p.nombre.toLowerCase().includes(search.toLowerCase()) &&
         (category === "Todas" || p.categoria === category)
  );

  // Agrupar por categoría para las filas horizontales (solo cuando no hay filtro activo)
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

  if (status === "loading") return <div className="state-message">Cargando catálogo…</div>;
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
        {/* Búsqueda */}
        <div className="catalog-tools" style={{ marginTop: "1.2rem" }}>
          <label className="field">
            <span>Buscar</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="¿Qué estás buscando?" />
          </label>
        </div>

        {!products.length ? (
          <div className="state-message"><h2>Catálogo vacío</h2><p>No hay productos activos publicados.</p></div>
        ) : !filtered.length ? (
          <div className="state-message">No hay coincidencias.</div>
        ) : byCategory ? (
          // Vista por filas de categoría
          <div className="catalogo-categorias">
            {byCategory.map(([cat, prods]) => (
              <div key={cat}>
                <h2 className="catalogo-categoria-titulo">
                  <Store size={16} strokeWidth={2} style={{ color: "var(--accent)" }} />
                  {cat}
                </h2>
                <div className="productos-fila">
                  {prods.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Vista grid con filtro activo
          <div className="product-grid">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        <SubscribeForm />
      </section>

      {/* FABs */}
      <div className="fab-container">
        <button className="fab-btn fab-theme" onClick={toggleDark} aria-label="Cambiar tema" title="Cambiar tema">
          {dark ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        <button className="fab-btn" onClick={() => navigate("/carrito")} aria-label="Ver carrito">
          <ShoppingCart size={22} />
          {itemCount > 0 && <span className="fab-badge">{itemCount}</span>}
        </button>
      </div>
    </>
  );
}
