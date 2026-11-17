
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          className="brand"
          to="/"
          aria-label="webshop DALE"
          style={{ textTransform: "none" }}
        >
          <span>webshop</span>
          <img
            src="./icon-icon.png"
            alt=""
            aria-hidden="true"
          />
          <span>DALE</span>
        </Link>
      </div>
    </header>
  );
}
