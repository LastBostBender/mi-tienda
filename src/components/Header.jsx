import { Link } from "react-router-dom";

// Pon tu nombre/logo aquí
const NOMBRE = "Mi Tienda";
// const LOGO_URL = "/logo.svg"; // descomenta si tienes logo

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/" aria-label={NOMBRE}>
          {/* LOGO_URL ? <img src={LOGO_URL} alt={NOMBRE} /> : NOMBRE */}
          {NOMBRE}
        </Link>
      </div>
    </header>
  );
}
