import "../styles-admin.css";
import "../styles-admin-products.css";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../utils/api";
import { formatCurrency } from "../hooks/useCurrency";

const EMPTY = { id: "", nombre: "", descripcion: "", precio: "", imagen_url: "", categoria: "", activo: true };
const STATES = ["pendiente", "confirmado", "pagado", "enviado", "entregado", "cancelado"];

function AdminIcon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "chevron") return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
  if (name === "save") return <svg {...common}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>;
  if (name === "cancel") return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>;
  if (name === "trash") return <svg {...common}><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>;
  return null;
}

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("tienda-admin-token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("productos");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [product, setProduct] = useState(EMPTY);
  const [expandedId, setExpandedId] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
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
      sessionStorage.setItem("tienda-admin-token", r.token); setToken(r.token); setPassword("");
      await Promise.all([loadProducts(r.token), loadOrders(r.token)]);
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    try { await apiRequest({ action: "admin_logout", token }); } catch {}
    sessionStorage.removeItem("tienda-admin-token"); setToken(""); setProducts([]); setOrders([]);
    closeProductEditor();
  }
  async function refresh() {
    setBusy(true); setError("");
    try { await Promise.all([loadProducts(), loadOrders()]); }
    catch (x) { setError(x.message); if (/sesión/i.test(x.message)) logout(); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (token) refresh(); }, []);

  function closeProductEditor() {
    setProduct(EMPTY);
    setExpandedId(null);
    setAddingProduct(false);
  }
  function openProductEditor(p) {
    setProduct({ ...p, precio: String(p.precio ?? "") });
    setExpandedId(p.id);
    setAddingProduct(false);
    setError(""); setNotice("");
  }
  function startNewProduct() {
    setProduct(EMPTY);
    setExpandedId(null);
    setAddingProduct(true);
    setError(""); setNotice("");
  }
  async function save(e) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await apiRequest({ action: "admin_product_save", token, product: { ...product, precio: Number(product.precio) } });
      setNotice("Producto guardado correctamente.");
      closeProductEditor();
      await loadProducts();
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }
  async function toggle(p) {
    if (!window.confirm(p.activo ? "¿Marcar como agotado?" : "¿Volver a publicar este producto?")) return;
    setBusy(true);
    try { await apiRequest({ action: "admin_product_active", token, id: p.id, active: !p.activo }); setNotice("Disponibilidad actualizada."); await loadProducts(); }
    catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }
  async function removeProduct(p) {
    if (!window.confirm(`¿Eliminar definitivamente «${p.nombre}»? Si aparece en pedidos históricos, el sistema puede impedirlo.`)) return;
    setBusy(true); setError("");
    try {
      await apiRequest({ action: "admin_product_delete", token, id: p.id });
      setNotice("Producto eliminado.");
      if (expandedId === p.id) closeProductEditor();
      await loadProducts();
    } catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }
  async function status(o, estado) {
    if (estado === "eliminado" && !window.confirm("El pedido se archivará sin borrar el registro. ¿Continuar?")) return;
    setBusy(true);
    try { await apiRequest({ action: "admin_order_status", token, row: o._row, estado }); await loadOrders(); }
    catch (x) { setError(x.message); }
    finally { setBusy(false); }
  }

  const shown = useMemo(() => products.filter(p => (p.nombre + " " + p.id + " " + p.categoria).toLowerCase().includes(search.toLowerCase())), [products, search]);
  const visibleOrders = orders.filter(o => o.estado !== "eliminado");

  function renderProductEditor() {
    return (
      <form className="admin-product-editor" onSubmit={save}>
        <div className="admin-editor-fields">
          <label className="field"><span>Nombre *</span><input value={product.nombre} onChange={e => setProduct({ ...product, nombre: e.target.value })} required maxLength="160" /></label>
          <label className="field"><span>Precio *</span><input type="number" min="0" step="0.01" value={product.precio} onChange={e => setProduct({ ...product, precio: e.target.value })} required /></label>
          <label className="field admin-editor-wide"><span>Descripción</span><textarea rows="2" value={product.descripcion} onChange={e => setProduct({ ...product, descripcion: e.target.value })} /></label>
          <label className="field"><span>Imagen URL HTTPS</span><input type="url" value={product.imagen_url} onChange={e => setProduct({ ...product, imagen_url: e.target.value })} /></label>
          <label className="field"><span>Categoría</span><input value={product.categoria} onChange={e => setProduct({ ...product, categoria: e.target.value })} /></label>
        </div>
        <label className="admin-check"><input type="checkbox" checked={!!product.activo} onChange={e => setProduct({ ...product, activo: e.target.checked })} /> Disponible en catálogo</label>
        <div className="admin-editor-actions">
          <button type="button" className="admin-icon-button" aria-label="Cancelar edición" title="Cancelar" onClick={closeProductEditor} disabled={busy}><AdminIcon name="cancel" /></button>
          {!addingProduct && <button type="button" className="admin-icon-button is-danger" aria-label="Eliminar producto" title="Eliminar producto" onClick={() => removeProduct({ ...product, id: expandedId })} disabled={busy}><AdminIcon name="trash" /></button>}
          <button type="submit" className="admin-icon-button is-save" aria-label="Guardar producto" title="Guardar" disabled={busy}><AdminIcon name="save" /></button>
        </div>
      </form>
    );
  }

  if (!token) return (
    <section className="admin-login">
      <p className="eyebrow">Área privada</p><h1>Administración</h1>
      <form className="checkout-form" onSubmit={login}>
        <label className="field"><span>Correo administrador</span><input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="field"><span>Contraseña</span><input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary" disabled={busy}>{busy ? "Accediendo…" : "Entrar"}</button>
      </form>
    </section>
  );

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div><p className="eyebrow">Área privada</p><h1>Administración</h1></div>
        <button className="button button-danger" onClick={logout}>Cerrar sesión</button>
      </div>
      <div className="admin-tabs">
        <button className={tab === "productos" ? "active" : ""} onClick={() => setTab("productos")}>Productos ({products.length})</button>
        <button className={tab === "pedidos" ? "active" : ""} onClick={() => setTab("pedidos")}>Pedidos ({visibleOrders.length})</button>
        <button className="button button-small" onClick={refresh} disabled={busy}>Actualizar</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {notice && <p className="form-notice">{notice}</p>}

      {tab === "productos" ? (
        <div className="admin-panel admin-products-panel">
          <div className="admin-list-heading">
            <h2>Productos</h2>
            <div className="admin-product-tools">
              <input aria-label="Buscar productos" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
              <button className="button button-primary admin-add-button" onClick={startNewProduct} disabled={busy || addingProduct}>
                <AdminIcon name="plus" size={16} /> Agregar
              </button>
            </div>
          </div>

          {addingProduct && <div className="admin-product-expanded admin-new-product"><div className="admin-expanded-title">Nuevo producto</div>{renderProductEditor()}</div>}

          <div className="admin-product-list">
            {shown.map(p => {
              const isOpen = expandedId === p.id;
              return (
                <div className={`admin-product-item${isOpen ? " is-expanded" : ""}`} key={p.id}>
                  <button type="button" className="admin-product-summary" onClick={() => isOpen ? closeProductEditor() : openProductEditor(p)} aria-expanded={isOpen}>
                    <span className="admin-product-name">{p.nombre}</span>
                    <span className="admin-product-price">{formatCurrency(p.precio)}</span>
                    <span className={`admin-product-chevron${isOpen ? " is-open" : ""}`}><AdminIcon name="chevron" size={18} /></span>
                  </button>
                  {isOpen && <div className="admin-product-expanded"><div className="admin-expanded-title">Editar producto</div>{renderProductEditor()}</div>}
                </div>
              );
            })}
            {!shown.length && <p className="admin-empty-list">{search ? "No hay productos que coincidan con la búsqueda." : "Todavía no hay productos. Usa «Agregar» para crear el primero."}</p>}
          </div>
        </div>
      ) : (
        <div className="admin-panel">
          <h2>Pedidos</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Fecha</th><th>Comprador</th><th>Entrega</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead>
              <tbody>{visibleOrders.map(o => (
                <tr key={o._row}>
                  <td>{o.timestamp ? new Date(o.timestamp).toLocaleString() : "—"}</td>
                  <td><strong>{o.compradorNombre || o.nombre}</strong><small>Tel.: {o.compradorTelefono || o.contacto}</small></td>
                  <td><strong>{o.recibeNombre || "No indicado"}</strong><small>Tel.: {o.recibeTelefono || "No indicado"}</small><small>{o.direccion}</small>{o.notas && <small>Nota: {o.notas}</small>}</td>
                  <td>{(o.items || []).map((it, i) => <small key={i}>{it.nombre} × {it.cantidad}</small>)}</td>
                  <td>{formatCurrency(o.total)}</td>
                  <td><select value={o.estado} onChange={e => status(o, e.target.value)}>{STATES.map(s => <option key={s}>{s}</option>)}<option value="eliminado">Archivar</option></select></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
