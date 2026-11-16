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
    <div className="quantity-stepper" aria-label={`Modificar cantidad de ${item.nombre}`}>
      <button type="button" onClick={() => change(-5)} disabled={item.cantidad <= 1} aria-label="Restar cinco">-5</button>
      <button type="button" onClick={() => change(-1)} disabled={item.cantidad <= 1} aria-label="Restar uno">-1</button>
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
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  function goCheckout() {
    if (!items.length || total < MINIMUM_ORDER) return;
    onClose();
    navigate("/checkout");
  }

  return (
    <>
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
              <ShoppingCart size={40} strokeWidth={1.5} style={{ margin: "0 auto 1rem", display: "block", color: "var(--text-muted)" }} />
              <p>Ningún producto en el carrito.</p>
            </div>
          ) : items.map((item) => (
            <article className="cart-row-compact" key={item.id}>
              <div className="cart-product-top">
                <div className="cart-product">
                  <strong>{item.nombre}</strong>
                  <span>Precio unitario: {formatCurrency(item.precio)}</span>
                </div>
              </div>

              <div className="cart-quantity-area">
                <input
                  type="number"
                  className="cart-quantity-input"
                  aria-label={`Cantidad de ${item.nombre}`}
                  value={item.cantidad}
                  min={1}
                  step={1}
                  inputMode="numeric"
                  onChange={(event) => {
                    if (event.target.value === "") return;
                    const quantity = Number.parseInt(event.target.value, 10);
                    if (Number.isInteger(quantity) && quantity >= 1) {
                      setQuantity(item.id, quantity);
                    }
                  }}
                />
                <div className="cart-subtotal">
                  <span></span>
                  <strong>{formatCurrency(item.precio * item.cantidad)}</strong>
                </div>
              </div>

              <div className="cart-row-bottom">
                <QuantityStepper item={item} setQuantity={setQuantity} />
                <button
                  type="button"
                  className="cart-delete-icon"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Eliminar ${item.nombre}`}
                  title="Eliminar producto"
                >
                  <Trash2 size={17} strokeWidth={2} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="drawer-footer">
          {!enough && items.length > 0 && (
            <p className="minimum-order-notice" role="status">
              Pedido mínimo: {formatCurrency(MINIMUM_ORDER)}. Añade {formatCurrency(missing)} más para continuar.
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
