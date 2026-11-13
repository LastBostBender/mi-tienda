import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Store, Settings } from "lucide-react";

export default function Header() {
  const { itemCount } = useCart();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/"><Store size={18} strokeWidth={2.5} /> Mi Tienda</Link>
        <nav aria-label="Navegación principal">
          <NavLink to="/">Catálogo</NavLink>
          <NavLink className="cart-link" to="/carrito">
            <ShoppingCart size={18} />
            Carrito
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </NavLink>
          <NavLink to="/admin"><Settings size={18} /></NavLink>
        </nav>
      </div>
    </header>
  );
}
