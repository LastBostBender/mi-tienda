import { useState } from "react";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  function handleAdd() {
    addItem(product, qty);
    setQty(1);
  }

  return (
    <article className="product-card">
      <div className="product-image-link">
        {product.imagen_url
          ? <img src={product.imagen_url} alt={product.nombre} loading="lazy" />
          : <div className="image-placeholder">📦</div>
        }
      </div>
      <div className="product-card-body">
        {product.categoria && <p className="eyebrow">{product.categoria}</p>}
        <h2>{product.nombre}</h2>
        {product.descripcion && (
          <p className="text-muted" style={{ fontSize: ".82rem", margin: "0 0 4px" }}>
            {product.descripcion}
          </p>
        )}
        <div className="price">{formatCurrency(product.precio)}</div>
        <div className="qty-row">
          <input
            type="number"
            className="qty-input"
            value={qty}
            min={1}
            onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <button className="button button-primary" style={{ flex: 1 }} onClick={handleAdd}>
            Añadir
          </button>
        </div>
      </div>
    </article>
  );
}
