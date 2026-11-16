import { useState } from "react";
import { ImageOff } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const change = n => setQty(current => Math.max(1, current + n));
  function handleAdd() { addItem(product, qty); setQty(1); }

  return <article className="product-card">
    <div className="product-image-link">
      {product.imagen_url ? <img src={product.imagen_url} alt={product.nombre} loading="lazy" /> :
        <div className="image-placeholder"><ImageOff size={32} /></div>}
    </div>
    <div className="product-card-body">
      {product.categoria && <p className="eyebrow">{product.categoria}</p>}
      <h2>{product.nombre}</h2>
      {product.descripcion && <p className="text-muted" style={{ fontSize: ".82rem", margin: "0 0 4px" }}>{product.descripcion}</p>}
      <div className="price">{formatCurrency(product.precio)}</div>
      <div className="catalog-quantity-controls">
        <div className="quantity-stepper" aria-label={`Cantidad de ${product.nombre}`}>
          <button type="button" onClick={() => change(-5)} disabled={qty <= 1}>−5</button>
          <button type="button" onClick={() => change(-1)} disabled={qty <= 1}>−1</button>
          <input type="number" className="qty-input" value={qty} min="1" step="1" inputMode="numeric"
            aria-label={`Cantidad de ${product.nombre}`}
            onChange={e => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))} />
          <button type="button" onClick={() => change(1)}>+1</button>
          <button type="button" onClick={() => change(5)}>+5</button>
        </div>
        <button className="button button-primary" onClick={handleAdd}>Añadir</button>
      </div>
    </div>
  </article>;
}
