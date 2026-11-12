import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";

export default function CartPage() {
  const { items, total, setQuantity, removeItem } = useCart();

  if (!items.length) return (
    <section className="state-message"><h1>Tu carrito está vacío</h1><p>Añade productos desde el catálogo.</p><Link className="button button-primary" to="/">Ir al catálogo</Link></section>
  );

  return (
    <section>
      <div className="page-heading"><h1>Tu carrito</h1></div>
      <div className="cart-list">
        {items.map((item) => (
          <article className="cart-row" key={item.id}>
            {item.imagen_url ? <img src={item.imagen_url} alt="" /> : <div className="cart-thumb">—</div>}
            <div className="cart-product"><strong>{item.nombre}</strong><span>{formatCurrency(item.precio)} / unidad</span></div>
            <label className="field cart-quantity"><span>Cantidad</span><input type="number" min="1" value={item.cantidad}
              onChange={(e) => setQuantity(item.id, e.target.value)} /></label>
            <strong className="cart-subtotal">{formatCurrency(item.precio * item.cantidad)}</strong>
            <button className="button button-danger button-small" onClick={() => removeItem(item.id)}>Eliminar</button>
          </article>
        ))}
      </div>
      <div className="cart-summary"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
      <div className="actions-end"><Link className="button button-primary" to="/checkout">Proceder al checkout</Link></div>
    </section>
  );
}
