
import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ThanksPage from "./pages/ThanksPage";
import { Phone } from "lucide-react";
function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3 20l1.2-4.9a8.2 8.2 0 1 1 16-3.4Z" />
      <path d="M8.5 8.1c.2-.5.4-.5.7-.5h.5c.2 0 .3.1.4.4l.7 1.7c.1.2.1.4 0 .5l-.5.7c-.2.2-.2.4 0 .6.4.7 1 1.3 1.7 1.7.2.1.4.1.6-.1l.7-.8c.2-.2.3-.2.6-.1l1.6.8c.3.1.4.2.4.4 0 .3-.2 1.1-.7 1.5-.5.4-1 .6-1.7.5-.7-.1-1.6-.4-2.7-1.1-1.4-.9-2.4-2.1-2.8-2.8-.4-.7-.7-1.5-.7-2.1 0-.5.2-1 .5-1.3Z" />
    </svg>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main className="container main-content">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/producto/:id" element={<ProductPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/gracias" element={<ThanksPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
     <footer className="site-footer">
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "7px"
  }}>
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      lineHeight: 1
    }}>
      <span>webshop</span>

      <img
        src="/icon-icon.png"
        alt=""
        style={{
          width: "13px",
          height: "13px",
          objectFit: "contain"
        }}
      />

      <span>DALE</span>
    </div>

    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "17px"
    }}>
      <a
        href="tel:+5355089427"
        aria-label="Llamar"
        title="Llamar"
        style={{ color: "inherit", display: "inline-flex" }}
      >
        <Phone size={15} strokeWidth={1.8} />
      </a>

      <a
        href="https://wa.me/5355089427"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        title="WhatsApp"
        style={{ color: "inherit", display: "inline-flex" }}
      >
        <WhatsAppIcon />
      </a>
    </div>
  </div>
</footer>
    </>
  );
}
