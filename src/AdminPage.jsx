import "./styles-admin.css";
import "./styles-admin-orders.css";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, ChevronDown, ChevronUp, Check, X, Trash2, Package, Search,
} from "lucide-react";
import { apiRequest } from "./utils/api";
import { formatCurrency } from "./hooks/useCurrency";

const EMPTY = {
  id: "", nombre: "", descripcion: "", precio: "",
  imagen_url: "", categoria: "", activo: true,
};

const normCat = (v) => String(v || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function CategoriaField({ value, onChange, categorias }) {
  const canonical = categorias.find(c => normCat(c) === normCat(value));
  const [creating, setCreating] = useState(Boolean(value) && !canonical);

  if (creating) {
    return (
      <div className="categoria-new">
        <input
          autoFocus
          placeholder="Nombre de la nueva categoría"
          value={value}
          maxLength="100"
          onChange={e => onChange(e.target.value)}
          onBlur={() => {
            const match = categorias.find(c => normCat(c) === normCat(value));
            if (match) { onChange(match); setCreating(false); }
          }}
        />
        <button type="button" className="admin-icon-button" title="Volver a la lista" aria-label="Volver a la lista"
          onClick={() => { setCreating(false); onChange(""); }}><X size={18} /></button>
      </div>
    );
  }
  return (
    <select className="categoria-select" value={canonical || ""}
      onChange={e => {
        if (e.target.value === "__nueva__") { setCreating(true); onChange(""); }
        else onChange(e.target.value);
      }}>
      <option value="">Sin categoría</option>
      {categorias.map(c => <option key={c} value={c}>{c}</option>)}
      <option value="__nueva__">+ Nueva categoría…</option>
    </select>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("tienda-admin-token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("productos");
  const [orderTab, setOrderTab] = useState("pendientes");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeEditor, setActiveEditor] = useState(null);
  const [product, setProduct] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadProducts(t = token) {
    const r = await apiRequest({ action: "admin_products", token: t });
    setProducts(r.products || []);
  }
  async function loadOrders(t = token) {
    const r = await apiRequest({ action: "admin_orders", token: t });
    setOrders(r.orders || []);
  }
  async function login(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await apiRequest({ action: "admin_login", email, password });
      sessionStorage.setItem("tienda-admin-token", r.token);
      setToken(r.token); setPassword("");
      await Promise.all([loadProducts(r.token), loadOrders(r.token)]);
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    try { await apiRequest({ action: "admin_logout", token }); } catch {}
    sessionStorage.removeItem("tienda-admin-token");
    setToken(""); setProducts([]); setOrders([]); closeEditor();
  }
  async function refresh() {
    setBusy(true); setError("");
    try { await Promise.all([loadProducts(), loadOrders()]); }
    catch (x) { setError(x.message); if (/sesión/i.test(x.message)) logout(); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (token) refresh(); }, []);

  function openNewProduct() {
    setError(""); setNotice(""); setProduct({ ...EMPTY }); setActiveEditor("new");
  }
  function openProduct(p) {
    setError(""); setNotice("");
    if (activeEditor === p.id) { closeEditor(); return; }
    setProduct({ ...p, precio: String(p.precio ?? "") }); setActiveEditor(p.id);
  }
  function closeEditor() { setActiveEditor(null); setProduct({ ...EMPTY }); }

  async function save(e) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await apiRequest({ action: "admin_product_save", token, product: { ...product, precio: Number(product.precio) } });
      setNotice("Producto guardado correctamente."); closeEditor(); await loadProducts();
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }
  async function toggle(p) {
    const question = p.activo ? "¿Marcar este producto como agotado?" : "¿Volver a publicar este producto?";
    if (!window.confirm(question)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await apiRequest({ action: "admin_product_active", token, id: p.id, active: !p.activo });
      setNotice("Disponibilidad actualizada."); closeEditor(); await loadProducts();
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }
  async function removeProduct(p) {
    if (!window.confirm(`¿Eliminar definitivamente "${p.nombre}"? Si aparece en pedidos históricos, el servidor puede impedirlo.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await apiRequest({ action: "admin_product_delete", token, id: p.id });
      setNotice("Producto eliminado."); closeEditor(); await loadProducts();
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }

  async function updatePrepared(o, prepared) {
    setBusy(true); setError("");
    try {
      await apiRequest({ action: "admin_order_items", token, row: o._row, prepared });
      await loadOrders();
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }
  async function confirmDelivery(o) {
    if (!window.confirm("¿Confirmar que este pedido fue entregado?")) return;
    setBusy(true); setError("");
    try {
      await apiRequest({ action: "admin_order_status", token, row: o._row, estado: "entregado" });
      await loadOrders();
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }
  async function removeOrder(o) {
    const who = o.compradorNombre || o.nombre || "este cliente";
    if (!window.confirm(`¿Eliminar definitivamente el pedido de ${who}? Esta acción no se puede deshacer.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await apiRequest({ action: "admin_order_delete", token, row: o._row });
      setNotice("Pedido eliminado."); await loadOrders();
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }

  const categorias = useMemo(() => {
    const seen = new Map();
    products.forEach(p => {
      const c = String(p.categoria || "").trim();
      if (c && !seen.has(normCat(c))) seen.set(normCat(c), c);
    });
    return [...seen.values()].sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);
  const shown = useMemo(() =>
    products.filter(p => `${p.nombre} ${p.id} ${p.categoria}`.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );
  const visibleOrders = orders
    .filter(o => !["eliminado", "cancelado"].includes(o.estado))
    .slice()
    .sort((a, b) => (Date.parse(a.timestamp) || 0) - (Date.parse(b.timestamp) || 0) || Number(a._row) - Number(b._row));
  const pendingOrders = visibleOrders.filter(o => !["listo_entrega", "entregado"].includes(o.estado));
  const readyOrders = visibleOrders.filter(o => o.estado === "listo_entrega");
  const deliveredOrders = visibleOrders.filter(o => o.estado === "entregado");

  if (!token) {
    return (
      <section className="admin-login">
        <p className="eyebrow">Área privada</p><h1>Administración</h1>
        <form className="checkout-form" onSubmit={login}>
          <label className="field"><span>Correo administrador</span>
            <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="field"><span>Contraseña</span>
            <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-primary" disabled={busy}>{busy ? "Accediendo…" : "Entrar"}</button>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div><p className="eyebrow">Área privada</p><h1>Administración</h1></div>
        <button className="button button-danger" onClick={logout}>Cerrar sesión</button>
      </div>

      <div className="admin-tabs">
        <button className={tab === "productos" ? "active" : ""} onClick={() => { setTab("productos"); closeEditor(); }}>
          Productos ({products.length})
        </button>
        <button className={tab === "pedidos" ? "active" : ""} onClick={() => { setTab("pedidos"); closeEditor(); }}>
          Pedidos ({visibleOrders.length})
        </button>
        <button className="button button-small" onClick={refresh} disabled={busy}>Actualizar</button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {notice && <p className="form-notice">{notice}</p>}

      {tab === "productos" ? (
        <div className="admin-panel admin-products-panel">
          <div className="admin-products-heading">
            <div><h2>Productos</h2><p>Toca un producto para ver sus opciones de edición.</p></div>
            <button type="button" className="button button-primary admin-add-button" onClick={openNewProduct} disabled={busy}>
              <Plus size={17} /><span>Agregar producto</span>
            </button>
          </div>
          <div className="admin-list-heading">
            <label className="admin-search"><Search size={17} />
              <input type="search" placeholder="Buscar producto…" value={search} onChange={e => setSearch(e.target.value)} />
            </label>
          </div>
          <div className="admin-product-list">
            {activeEditor === "new" && (
              <div className="admin-product-item is-open">
                <div className="admin-product-summary new-product-summary"><Package size={19} /><strong>Nuevo producto</strong></div>
                <ProductEditor categorias={categorias} product={product} setProduct={setProduct} onSave={save} onCancel={closeEditor} busy={busy} isNew />
              </div>
            )}
            {shown.map(p => {
              const isOpen = activeEditor === p.id;
              return (
                <div className={`admin-product-item ${isOpen ? "is-open" : ""}`} key={p.id}>
                  <button type="button" className="admin-product-summary" onClick={() => openProduct(p)} aria-expanded={isOpen} disabled={busy}>
                    <span className="admin-product-name">{p.nombre}</span>
                    <span className="admin-product-price">{formatCurrency(p.precio)}</span>
                    {isOpen ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
                  </button>
                  {isOpen && (
                    <ProductEditor categorias={categorias} product={product} setProduct={setProduct} onSave={save} onCancel={closeEditor}
                      onDelete={() => removeProduct(p)} onToggle={() => toggle(p)} busy={busy} isNew={false} originalProduct={p} />
                  )}
                </div>
              );
            })}
            {shown.length === 0 && activeEditor !== "new" && (
              <div className="admin-products-empty">{search ? "No se encontraron productos." : "Todavía no hay productos registrados."}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-panel admin-orders-panel">
          <h2>Pedidos</h2>

          <div className="admin-order-tabs">
            <button type="button" className={orderTab === "pendientes" ? "active" : ""} onClick={() => setOrderTab("pendientes")}>
              Pendientes <span>{pendingOrders.length}</span>
            </button>
            <button type="button" className={orderTab === "listos" ? "active" : ""} onClick={() => setOrderTab("listos")}>
              Listos para entregar <span>{readyOrders.length}</span>
            </button>
            <button type="button" className={orderTab === "entregados" ? "active" : ""} onClick={() => setOrderTab("entregados")}>
              Entregados <span>{deliveredOrders.length}</span>
            </button>
          </div>

          <div className="admin-order-content">
            {orderTab === "pendientes" && (
              <OrderColumn title="Pedidos pendientes" orders={pendingOrders} empty="No hay pedidos pendientes.">
                {o => (
                  <OrderCard key={o._row} order={o} busy={busy} onDelete={removeOrder}>
                    <div className="order-items-checklist">
                      <div className="order-checklist-heading">
                        <strong>Preparación</strong>
                        <button type="button" className="order-text-button" disabled={busy}
                          onClick={() => updatePrepared(o, (o.items || []).map(() => true))}>Marcar todos</button>
                      </div>
                      {(o.items || []).map((it, i) => (
                        <label className="order-item-check" key={i}>
                          <input type="checkbox" checked={!!it.preparado} disabled={busy}
                            onChange={e => updatePrepared(o, (o.items || []).map((x, j) => j === i ? e.target.checked : !!x.preparado))} />
                          <span>{it.nombre} × {it.cantidad}</span>
                          <small>{formatCurrency(it.subtotal ?? (Number(it.precio) * Number(it.cantidad)))}</small>
                        </label>
                      ))}
                    </div>
                  </OrderCard>
                )}
              </OrderColumn>
            )}

            {orderTab === "listos" && (
              <OrderColumn title="Pedidos listos para entrega" orders={readyOrders} empty="Todavía no hay pedidos listos.">
                {o => (
                  <OrderCard key={o._row} order={o} busy={busy} onDelete={removeOrder} variant="ready">
                    <button type="button" className="button button-primary order-delivery-button" disabled={busy}
                      onClick={() => confirmDelivery(o)}><Check size={16} /> Confirmar entrega</button>
                  </OrderCard>
                )}
              </OrderColumn>
            )}

            {orderTab === "entregados" && (
              <OrderColumn title="Pedidos entregados" orders={deliveredOrders} empty="Todavía no hay pedidos entregados.">
                {o => <OrderCard key={o._row} order={o} busy={busy} onDelete={removeOrder} variant="delivered" />}
              </OrderColumn>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function OrderColumn({ title, orders, empty, children }) {
  return (
    <section className="order-column">
      <header className="order-column-heading"><h3>{title}</h3><span>{orders.length}</span></header>
      {orders.length ? orders.map(o => children(o)) : <p className="order-column-empty">{empty}</p>}
    </section>
  );
}

function OrderCard({ order: o, busy, onDelete, children, variant = "pending" }) {
  const showDeliveryDetails = variant === "ready";
  const showProductSummary = variant === "ready" || variant === "delivered";

  return (
    <article className={`order-card order-card-${variant}`}>
      <div className="order-card-top">
        <div><strong>{o.compradorNombre || o.nombre || "Cliente"}</strong>
          <small>{o.timestamp ? new Date(o.timestamp).toLocaleString() : "Fecha no disponible"}</small>
        </div>
        <button type="button" className="admin-icon-button admin-delete-button order-delete-button"
          title="Eliminar pedido" aria-label="Eliminar pedido" disabled={busy} onClick={() => onDelete(o)}>
          <Trash2 size={17} />
        </button>
      </div>

      {showDeliveryDetails && (
        <div className="order-card-contact">
          <span>Teléfono del comprador: {o.compradorTelefono || o.contacto || "—"}</span>
          <strong>Quien recibe: {o.recibeNombre || "No indicado"}</strong>
          <span>Teléfono del destinatario: {o.recibeTelefono || "No indicado"}</span>
          <span>Dirección de entrega: {o.direccion || "No indicada"}</span>
          {o.notas && <span>Notas: {o.notas}</span>}
        </div>
      )}

      {showProductSummary && (
        <div className={`order-delivered-items ${variant === "ready" ? "order-ready-items" : ""}`}>
          <strong>{variant === "ready" ? "Productos para entregar:" : "Productos:"}</strong>
          {(o.items || []).map((it, i) => (
            <small key={i}>{it.nombre} × {it.cantidad}</small>
          ))}
        </div>
      )}

      {children}

      <footer className="order-card-total"><span>Total del pedido</span><strong>{formatCurrency(o.total)}</strong></footer>
    </article>
  );
}

function ProductEditor({ categorias, product, setProduct, onSave, onCancel, onDelete, onToggle, busy, isNew, originalProduct }) {
  function update(field, value) { setProduct(current => ({ ...current, [field]: value })); }
  return (
    <form className="admin-product-editor" onSubmit={onSave}>
      <label className="field"><span>Nombre *</span>
        <input value={product.nombre} onChange={e => update("nombre", e.target.value)} required maxLength="160" />
      </label>
      <label className="field"><span>Precio *</span>
        <input type="number" min="0" step="0.01" value={product.precio} onChange={e => update("precio", e.target.value)} required />
      </label>
      <label className="field"><span>Descripción</span>
        <textarea rows="3" value={product.descripcion || ""} onChange={e => update("descripcion", e.target.value)} />
      </label>
      <label className="field"><span>Imagen URL HTTPS</span>
        <input type="url" value={product.imagen_url || ""} onChange={e => update("imagen_url", e.target.value)} placeholder="https://…" />
      </label>
      <div className="field"><span>Categoría</span>
        <CategoriaField value={product.categoria || ""} onChange={v => update("categoria", v)} categorias={categorias} />
      </div>
      <label className="admin-check">
        <input type="checkbox" checked={!!product.activo} onChange={e => update("activo", e.target.checked)} />
        Disponible en el catálogo
      </label>
      <div className="admin-product-editor-footer">
        {!isNew && originalProduct && (
          <div className="admin-product-secondary-actions">
            <button type="button" className="admin-icon-button admin-delete-button" onClick={onDelete} disabled={busy} title="Eliminar producto" aria-label="Eliminar producto"><Trash2 size={18} /></button>
            <button type="button" className="button admin-availability-button" onClick={onToggle} disabled={busy}>
              {originalProduct.activo ? "Marcar agotado" : "Volver a publicar"}
            </button>
          </div>
        )}
        <div className="admin-product-main-actions">
          <button type="button" className="admin-icon-button" onClick={onCancel} disabled={busy} title="Cancelar" aria-label="Cancelar"><X size={19} /></button>
          <button type="submit" className="admin-icon-button admin-save-button" disabled={busy} title="Guardar" aria-label="Guardar"><Check size={19} /></button>
        </div>
      </div>
    </form>
  );
}
