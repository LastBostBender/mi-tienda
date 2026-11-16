import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, X, Receipt } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";

const MINIMUM_ORDER = 50;

function QuantityStepper({ item, setQuantity }) {
  const change = (amount) => {
    setQuantity(item.id, Math.max(1, Number(item.cantidad) + amount));
  };

  return (
    <div className="drawer-quantity-stepper" aria-label={`Modificar cantidad de ${item.nombre}`}>
      <button type="button" onClick={() => change(-5)} disabled={item.cantidad <= 1} aria-label="Restar cinco">−5</button>
      <button type="button" onClick={() => change(-1)} disabled={item.cantidad <= 1} aria-label="Restar uno">−1</button>
      <button type="button" onClick={() => change(1)} aria-label="Sumar uno">+1</button>
      <button type="button" onClick={() => change(5)} aria-label="Sumar cinco">+5</button>
    </div>
  );
}

export default function CartDrawer({ open, onClose }) {
  const { items, total, setQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const enough = total >= MINIMUM_ORDER;
  const missing = Math.max(0, MINIMUM_ORDER - total);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function goCheckout() {
    if (!items.length || total < MINIMUM_ORDER) return;
    onClose();
    navigate("/checkout");
  }

  return (
    <>
      {/* Estilos propios del panel: no es necesario modificar global.css. */}
      <style>{`
        .drawer-product {
          display:flex; flex-direction:column; gap:5px; min-width:0;
          padding:11px 12px 10px; background:var(--bg-surface);
          border:1px solid var(--border); border-radius:8px;
        }
        .drawer-product-name {
          color:var(--text-main); font-size:.88rem; line-height:1.35;
          font-weight:700; overflow-wrap:anywhere;
        }
        .drawer-unit-price {
          color:var(--text-muted); font-size:.77rem; line-height:1.35;
        }
        .drawer-product-amounts {
          display:flex; align-items:center; justify-content:space-between;
          gap:10px; min-width:0; margin-top:3px;
        }
        .drawer-quantity-input {
          width:66px !important; min-height:34px !important; height:34px;
          flex:0 0 66px; padding:3px 5px; font-size:.86rem;
        }
        .drawer-subtotal {
          display:flex; align-items:baseline; justify-content:flex-end;
          gap:7px; min-width:0; color:var(--text-muted); font-size:.78rem;
        }
        .drawer-subtotal strong {
          color:var(--price-color); font-size:.88rem; font-weight:700;
          white-space:nowrap;
        }
        .drawer-product-controls {
          display:flex; align-items:center; justify-content:space-between;
          gap:8px; min-width:0; margin-top:2px;
        }
        .drawer-quantity-stepper {
          display:flex; align-items:center; gap:5px; min-width:0;
        }
        .drawer-quantity-stepper button {
          min-width:35px; min-height:31px; padding:3px 6px;
          border:1px solid var(--border); border-radius:6px;
          background:var(--bg-body); color:var(--text-main);
          font:600 .76rem 'Poppins',sans-serif; cursor:pointer;
        }
        .drawer-quantity-stepper button:disabled {
          opacity:.35; cursor:not-allowed;
        }
        .drawer-delete {
          display:grid; place-items:center; width:32px; height:32px;
          flex:0 0 32px; margin-left:auto; border:0; border-radius:6px;
          background:var(--danger-bg); color:var(--danger); cursor:pointer;
        }
        .drawer-minimum-notice {
          margin:0 0 12px; padding:9px 10px; border-radius:7px;
          background:var(--accent-light); color:var(--text-main);
          font-size:.78rem; line-height:1.45;
        }
        @media (max-width:380px) {
          .drawer-body { padding:10px; gap:8px; }
          .drawer-product { padding:9px 10px; }
          .drawer-quantity-stepper { gap:4px; }
          .drawer-quantity-stepper button {
            min-width:32px; min-height:30px; padding-inline:4px;
            font-size:.72rem;
          }
        }
      `}</style>

      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Carrito">
        <div className="drawer-header">
          <h5><Receipt size={16} strokeWidth={2} /> Orden Actual</h5>
          <button className="drawer-close" onClick={onClose} aria-label="Cerrar">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="drawer-body">
          {!items.length ? (
            <div className="carrito-empty">
              <ShoppingCart
                size={40}
                strokeWidth={1.5}
                style={{ margin: "0 auto 1rem", display: "block", color: "var(--text-muted)" }}
              />
              <p>Ningún producto en el carrito.</p>
            </div>
          ) : (
            items.map((item) => (
              <article className="drawer-product" key={item.id}>
                <div className="drawer-product-name">{item.nombre}</div>
                <div className="drawer-unit-price">
                  Precio unitario: {formatCurrency(item.precio)}
                </div>

                <div className="drawer-product-amounts">
                  <input
                    type="number"
                    className="qty-input drawer-quantity-input"
                    aria-label={`Cantidad de ${item.nombre}`}
                    value={item.cantidad}
                    min={1}
                    step={1}
                    inputMode="numeric"
                    onChange={(e) => {
                      if (e.target.value === "") return;
                      const quantity = Number.parseInt(e.target.value, 10);
                      if (Number.isInteger(quantity) && quantity >= 1) {
                        setQuantity(item.id, quantity);
                      }
                    }}
                  />
                  <div className="drawer-subtotal">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(item.precio * item.cantidad)}</strong>
                  </div>
                </div>

                <div className="drawer-product-controls">
                  <QuantityStepper item={item} setQuantity={setQuantity} />
                  <button
                    type="button"
                    className="drawer-delete"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Eliminar ${item.nombre}`}
                    title="Eliminar producto"
                  >
                    <Trash2 size={17} strokeWidth={2} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="drawer-footer">
          {!enough && items.length > 0 && (
            <p className="drawer-minimum-notice" role="status">
              Pedido mínimo: {formatCurrency(MINIMUM_ORDER)}.
              Añade {formatCurrency(missing)} más para continuar.
            </p>
          )}

          <div className="drawer-summary">
            <div className="drawer-summary-row total">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            className="button button-primary button-full"
            style={{ marginTop: "1rem" }}
            disabled={!items.length || !enough}
            onClick={goCheckout}
          >
            Proceder al Pago
          </button>
        </div>
      </aside>
    </>
  );
}
