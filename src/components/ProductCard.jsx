import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  return (
    <article className="product-card">
      <Link to={`/producto/${encodeURIComponent(product.id)}`} className="product-image-link">
        {product.imagen_url
          ? <img src={product.imagen_url} alt={product.nombre} loading="lazy" />
          : <div className="image-placeholder">Sin imagen</div>}
      </Link>
      <div className="product-card-body">
        <p className="eyebrow">{product.categoria || "General"}</p>
        <h2><Link to={`/producto/${encodeURIComponent(product.id)}`}>{product.nombre}</Link></h2>
        <strong className="price">{formatCurrency(product.precio)}</strong>
        <button className="button button-primary button-full" onClick={() => addItem(product)}>
          Añadir al carrito
        </button>
      </div>
    </article>
  );
}
