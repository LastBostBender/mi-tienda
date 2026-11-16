import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";
import { Trash2, ImageOff, ShoppingCart } from "lucide-react";

const MINIMUM_ORDER = 50;

function Stepper({ quantity, onChange }) {
  const change = (n) => onChange(Math.max(1, quantity + n));
  return <div className="quantity-stepper" aria-label="Ajustar cantidad">
    <button type="button" onClick={() => change(-5)} disabled={quantity <= 1}>−5</button>
    <button type="button" onClick={() => change(-1)} disabled={quantity <= 1}>−1</button>
    <button type="button" onClick={() => change(1)}>+1</button>
    <button type="button" onClick={() => change(5)}>+5</button>
  </div>;
}

export default function CartPage() {
  const { items, total, setQuantity, removeItem } = useCart();
  const enough = total >= MINIMUM_ORDER;
  const missing = Math.max(0, MINIMUM_ORDER - total);

  if (!items.length) return <section className="state-message">
    <ShoppingCart size={40} style={{ margin: "0 auto 16px", display: "block" }} />
    <h1>Tu carrito está vacío</h1><p>Añade productos desde el catálogo.</p>
    <Link className="button button-primary" to="/">Ir al catálogo</Link>
  </section>;

  return <section>
    <div className="page-heading"><h1>Tu carrito</h1></div>
    <div className="cart-list">
      {items.map(item => <article className="cart-row cart-row-compact" key={item.id}>
        <div className="cart-product-top">
          {item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} /> :
            <div className="cart-thumb"><ImageOff size={20} /></div>}
          <div className="cart-product"><strong>{item.nombre}</strong>
            <span>{formatCurrency(item.precio)} / unidad</span></div>
        </div>
        <div className="cart-quantity-area">
          <input className="cart-quantity-input" type="number" min="1" step="1" inputMode="numeric"
            aria-label={`Cantidad de ${item.nombre}`} value={item.cantidad}
            onChange={e => setQuantity(item.id, Math.max(1, parseInt(e.target.value, 10) || 1))} />
          <strong className="cart-subtotal">{formatCurrency(item.precio * item.cantidad)}</strong>
        </div>
        <div className="cart-row-bottom">
          <Stepper quantity={item.cantidad} onChange={q => setQuantity(item.id, q)} />
          <button className="cart-delete-icon" type="button" onClick={() => removeItem(item.id)}
            aria-label={`Eliminar ${item.nombre}`} title="Eliminar producto"><Trash2 size={19} /></button>
        </div>
      </article>)}
    </div>
    <div className="cart-summary"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
    {!enough && <p className="minimum-order-notice" role="status">
      El pedido mínimo es {formatCurrency(MINIMUM_ORDER)}. Añade {formatCurrency(missing)} más para continuar.
    </p>}
    <div className="actions-end">{enough
      ? <Link className="button button-primary" to="/checkout">Proceder al checkout</Link>
      : <button className="button button-primary" type="button" disabled>Pedido mínimo no alcanzado</button>}
    </div>
  </section>;
}
