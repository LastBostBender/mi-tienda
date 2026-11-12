import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";

export default function ProductPage() {
  const { id } = useParams();
  const { products, status } = useProducts();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (status === "loading") return <p className="state-message">Cargando producto…</p>;
  const product = products.find((p) => p.id === id);
  if (!product) return <section className="state-message"><h1>Producto no encontrado</h1><Link to="/">Volver al catálogo</Link></section>;

  return (
    <section className="product-detail">
      <div className="detail-image">
        {product.imagen_url ? <img src={product.imagen_url} alt={product.nombre} /> : <div className="image-placeholder">Sin imagen</div>}
      </div>
      <div className="detail-info">
        <p className="eyebrow">{product.categoria || "General"}</p>
        <h1>{product.nombre}</h1>
        <p className="detail-description">{product.descripcion || "Sin descripción disponible."}</p>
        <p className="detail-price">{formatCurrency(product.precio)}</p>
        <label className="field quantity-field">
          <span>Cantidad</span>
          <input type="number" min="1" step="1" value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
        </label>
        <button className="button button-primary" onClick={() => addItem(product, quantity)}>Añadir al carrito</button>
        <p><Link to="/">← Volver al catálogo</Link></p>
      </div>
    </section>
  );
}
