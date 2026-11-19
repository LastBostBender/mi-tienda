
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
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.09-1.34A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm4.93 13.44c-.21.59-1.22 1.12-1.68 1.17-.43.05-.97.07-1.57-.1-.36-.1-.83-.27-1.42-.53-2.5-1.08-4.13-3.6-4.25-3.77-.12-.16-.98-1.3-.98-2.49 0-1.18.62-1.76.84-2 .22-.23.48-.29.64-.29h.46c.15 0 .35-.06.55.42l.76 1.84c.07.16.11.35.01.56l-.44.64c-.09.13-.19.27-.08.53.42.93 1.08 1.65 1.88 2.14.26.16.47.13.64-.05l.47-.56c.19-.22.37-.15.6-.06l1.95.92c.22.11.37.16.42.25.07.14.07.78-.19 1.38Z"/>
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
        src="./icon-icon.png"
        alt=""
        aria-hidden="true"
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
