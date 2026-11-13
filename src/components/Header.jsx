import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
export default function Header(){const {itemCount}=useCart();return <header className="site-header"><div className="container header-inner"><Link className="brand" to="/">Mi tienda</Link><nav aria-label="Navegación principal"><NavLink to="/">Catálogo</NavLink><NavLink className="cart-link" to="/carrito">Carrito <span className="cart-badge">{itemCount}</span></NavLink><NavLink to="/admin">Administración</NavLink></nav></div></header>;}
