import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";

export default function CartDrawer({ open, onClose }) {
  const { items, total, setQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  function goCheckout() {
    onClose();
    navigate("/checkout");
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Carrito">

        <div className="drawer-header">
          <h5>🧾 Orden Actual</h5>
          <button className="drawer-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="drawer-body">
          {!items.length ? (
            <div className="carrito-empty">
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🛒</div>
              <p>Ningún registro en curso.</p>
            </div>
          ) : items.map((item) => (
            <div className="carrito-item" key={item.id}>
              <div className="carrito-item-header">
                <span className="carrito-item-name">{item.nombre}</span>
                <span className="carrito-item-price">{formatCurrency(item.precio * item.cantidad)}</span>
              </div>
              <div className="carrito-item-actions">
                <div className="carrito-item-qty">
                  <span>Cant:</span>
                  <input
                    type="number"
                    className="qty-input"
                    style={{ width: 60, minHeight: 34, padding: "2px 6px" }}
                    value={item.cantidad}
                    min={1}
                    onChange={e => {
                      const v = parseInt(e.target.value);
                      if (v >= 1) setQuantity(item.id, v);
                      else removeItem(item.id);
                    }}
                  />
                </div>
                <button className="btn-delete" onClick={() => removeItem(item.id)} aria-label="Eliminar">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="drawer-footer">
          <div className="drawer-summary">
            <div className="drawer-summary-row total">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <button
            className="button button-primary button-full"
            style={{ marginTop: "1rem" }}
            disabled={!items.length}
            onClick={goCheckout}
          >
            Proceder al Pago
          </button>
        </div>

      </aside>
    </>
  );
}
