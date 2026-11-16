import "./styles-admin.css";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Trash2,
  Package,
  Search,
} from "lucide-react";
import { apiRequest } from "./utils/api";
import { formatCurrency } from "./hooks/useCurrency";

const EMPTY = {
  id: "",
  nombre: "",
  descripcion: "",
  precio: "",
  imagen_url: "",
  categoria: "",
  activo: true,
};

const STATES = [
  "pendiente",
  "confirmado",
  "pagado",
  "enviado",
  "entregado",
  "cancelado",
];

export default function AdminPage() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("tienda-admin-token") || ""
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("productos");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // "new" representa el formulario para crear un producto.
  // Cualquier otro valor representa el ID del producto abierto.
  const [activeEditor, setActiveEditor] = useState(null);
  const [product, setProduct] = useState(EMPTY);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadProducts(t = token) {
    const r = await apiRequest({
      action: "admin_products",
      token: t,
    });
    setProducts(r.products || []);
  }

  async function loadOrders(t = token) {
    const r = await apiRequest({
      action: "admin_orders",
      token: t,
    });
    setOrders(r.orders || []);
  }

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const r = await apiRequest({
        action: "admin_login",
        email,
        password,
      });

      sessionStorage.setItem("tienda-admin-token", r.token);
      setToken(r.token);
      setPassword("");

      await Promise.all([
        loadProducts(r.token),
        loadOrders(r.token),
      ]);
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await apiRequest({
        action: "admin_logout",
        token,
      });
    } catch {}

    sessionStorage.removeItem("tienda-admin-token");
    setToken("");
    setProducts([]);
    setOrders([]);
    closeEditor();
  }

  async function refresh() {
    setBusy(true);
    setError("");

    try {
      await Promise.all([
        loadProducts(),
        loadOrders(),
      ]);
    } catch (x) {
      setError(x.message);
      if (/sesión/i.test(x.message)) logout();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (token) refresh();
  }, []);

  function openNewProduct() {
    setError("");
    setNotice("");
    setProduct({ ...EMPTY });
    setActiveEditor("new");
  }

  function openProduct(p) {
    setError("");
    setNotice("");

    if (activeEditor === p.id) {
      closeEditor();
      return;
    }

    setProduct({
      ...p,
      precio: String(p.precio ?? ""),
    });
    setActiveEditor(p.id);
  }

  function closeEditor() {
    setActiveEditor(null);
    setProduct({ ...EMPTY });
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await apiRequest({
        action: "admin_product_save",
        token,
        product: {
          ...product,
          precio: Number(product.precio),
        },
      });

      setNotice(
        "Producto guardado correctamente."
      );

      closeEditor();
      await loadProducts();
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p) {
    const question = p.activo
      ? "¿Marcar este producto como agotado?"
      : "¿Volver a publicar este producto?";

    if (!window.confirm(question)) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await apiRequest({
        action: "admin_product_active",
        token,
        id: p.id,
        active: !p.activo,
      });

      setNotice("Disponibilidad actualizada.");
      closeEditor();
      await loadProducts();
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct(p) {
    if (
      !window.confirm(
        `¿Eliminar definitivamente "${p.nombre}"? Si aparece en pedidos históricos, el servidor puede impedirlo.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await apiRequest({
        action: "admin_product_delete",
        token,
        id: p.id,
      });

      setNotice("Producto eliminado.");
      closeEditor();
      await loadProducts();
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  async function status(o, estado) {
    if (
      estado === "eliminado" &&
      !window.confirm(
        "El pedido se archivará sin borrar el registro. ¿Continuar?"
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      await apiRequest({
        action: "admin_order_status",
        token,
        row: o._row,
        estado,
      });

      await loadOrders();
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  const shown = useMemo(
    () =>
      products.filter((p) =>
        `${p.nombre} ${p.id} ${p.categoria}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [products, search]
  );

  const visibleOrders = orders.filter(
    (o) => o.estado !== "eliminado"
  );

  if (!token) {
    return (
      <section className="admin-login">
        <p className="eyebrow">Área privada</p>
        <h1>Administración</h1>

        <form className="checkout-form" onSubmit={login}>
          <label className="field">
            <span>Correo administrador</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            className="button button-primary"
            disabled={busy}
          >
            {busy ? "Accediendo…" : "Entrar"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Área privada</p>
          <h1>Administración</h1>
        </div>

        <button
          className="button button-danger"
          onClick={logout}
        >
          Cerrar sesión
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={tab === "productos" ? "active" : ""}
          onClick={() => {
            setTab("productos");
            closeEditor();
          }}
        >
          Productos ({products.length})
        </button>

        <button
          className={tab === "pedidos" ? "active" : ""}
          onClick={() => {
            setTab("pedidos");
            closeEditor();
          }}
        >
          Pedidos ({visibleOrders.length})
        </button>

        <button
          className="button button-small"
          onClick={refresh}
          disabled={busy}
        >
          Actualizar
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {notice && <p className="form-notice">{notice}</p>}

      {tab === "productos" ? (
        <div className="admin-panel admin-products-panel">
          <div className="admin-products-heading">
            <div>
              <h2>Productos</h2>
              <p>
                Toca un producto para ver sus opciones de edición.
              </p>
            </div>

            <button
              type="button"
              className="button button-primary admin-add-button"
              onClick={openNewProduct}
              disabled={busy}
            >
              <Plus size={17} />
              <span>Agregar producto</span>
            </button>
          </div>

          <div className="admin-list-heading">
            <label className="admin-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Buscar producto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          <div className="admin-product-list">
            {activeEditor === "new" && (
              <div className="admin-product-item is-open">
                <div className="admin-product-summary new-product-summary">
                  <Package size={19} />
                  <strong>Nuevo producto</strong>
                </div>

                <ProductEditor
                  product={product}
                  setProduct={setProduct}
                  onSave={save}
                  onCancel={closeEditor}
                  busy={busy}
                  isNew
                />
              </div>
            )}

            {shown.map((p) => {
              const isOpen = activeEditor === p.id;

              return (
                <div
                  className={`admin-product-item ${isOpen ? "is-open" : ""}`}
                  key={p.id}
                >
                  <button
                    type="button"
                    className="admin-product-summary"
                    onClick={() => openProduct(p)}
                    aria-expanded={isOpen}
                    disabled={busy}
                  >
                    <span className="admin-product-name">
                      {p.nombre}
                    </span>

                    <span className="admin-product-price">
                      {formatCurrency(p.precio)}
                    </span>

                    {isOpen ? (
                      <ChevronUp size={19} />
                    ) : (
                      <ChevronDown size={19} />
                    )}
                  </button>

                  {isOpen && (
                    <ProductEditor
                      product={product}
                      setProduct={setProduct}
                      onSave={save}
                      onCancel={closeEditor}
                      onDelete={() => removeProduct(p)}
                      onToggle={() => toggle(p)}
                      busy={busy}
                      isNew={false}
                      originalProduct={p}
                    />
                  )}
                </div>
              );
            })}

            {shown.length === 0 && activeEditor !== "new" && (
              <div className="admin-products-empty">
                {search
                  ? "No se encontraron productos."
                  : "Todavía no hay productos registrados."}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-panel">
          <h2>Pedidos</h2>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Comprador</th>
                  <th>Entrega</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {visibleOrders.map((o) => (
                  <tr key={o._row}>
                    <td>
                      {o.timestamp
                        ? new Date(o.timestamp).toLocaleString()
                        : "—"}
                    </td>

                    <td>
                      <strong>
                        {o.compradorNombre || o.nombre}
                      </strong>
                      <small>
                        Tel.: {o.compradorTelefono || o.contacto}
                      </small>
                    </td>

                    <td>
                      <strong>{o.recibeNombre || "No indicado"}</strong>
                      <small>
                        Tel.: {o.recibeTelefono || "No indicado"}
                      </small>
                      <small>{o.direccion}</small>
                      {o.notas && <small>Nota: {o.notas}</small>}
                    </td>

                    <td>
                      {(o.items || []).map((it, i) => (
                        <small key={i}>
                          {it.nombre} × {it.cantidad}
                        </small>
                      ))}
                    </td>

                    <td>{formatCurrency(o.total)}</td>

                    <td>
                      <select
                        value={o.estado}
                        onChange={(e) =>
                          status(o, e.target.value)
                        }
                      >
                        {STATES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                        <option value="eliminado">Archivar</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function ProductEditor({
  product,
  setProduct,
  onSave,
  onCancel,
  onDelete,
  onToggle,
  busy,
  isNew,
  originalProduct,
}) {
  function update(field, value) {
    setProduct((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <form className="admin-product-editor" onSubmit={onSave}>
      <label className="field">
        <span>Nombre *</span>
        <input
          value={product.nombre}
          onChange={(e) => update("nombre", e.target.value)}
          required
          maxLength="160"
        />
      </label>

      <label className="field">
        <span>Precio *</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={product.precio}
          onChange={(e) => update("precio", e.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Descripción</span>
        <textarea
          rows="3"
          value={product.descripcion || ""}
          onChange={(e) => update("descripcion", e.target.value)}
        />
      </label>

      <label className="field">
        <span>Imagen URL HTTPS</span>
        <input
          type="url"
          value={product.imagen_url || ""}
          onChange={(e) => update("imagen_url", e.target.value)}
          placeholder="https://…"
        />
      </label>

      <label className="field">
        <span>Categoría</span>
        <input
          value={product.categoria || ""}
          onChange={(e) => update("categoria", e.target.value)}
        />
      </label>

      <label className="admin-check">
        <input
          type="checkbox"
          checked={!!product.activo}
          onChange={(e) => update("activo", e.target.checked)}
        />
        Disponible en el catálogo
      </label>

      <div className="admin-product-editor-footer">
        {!isNew && originalProduct && (
          <div className="admin-product-secondary-actions">
            <button
              type="button"
              className="admin-icon-button admin-delete-button"
              onClick={onDelete}
              disabled={busy}
              title="Eliminar producto"
              aria-label="Eliminar producto"
            >
              <Trash2 size={18} />
            </button>

            <button
              type="button"
              className="button admin-availability-button"
              onClick={onToggle}
              disabled={busy}
            >
              {originalProduct.activo
                ? "Marcar agotado"
                : "Volver a publicar"}
            </button>
          </div>
        )}

        <div className="admin-product-main-actions">
          <button
            type="button"
            className="admin-icon-button"
            onClick={onCancel}
            disabled={busy}
            title="Cancelar"
            aria-label="Cancelar"
          >
            <X size={19} />
          </button>

          <button
            type="submit"
            className="admin-icon-button admin-save-button"
            disabled={busy}
            title="Guardar"
            aria-label="Guardar"
          >
            <Check size={19} />
          </button>
        </div>
      </div>
    </form>
  );
}
