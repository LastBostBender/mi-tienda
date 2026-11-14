import { Link } from "react-router-dom";
import { Store } from "lucide-react";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/"><Store size={20} strokeWidth={2.5} /> Mi Tienda</Link>
      </div>
    </header>
  );
}
