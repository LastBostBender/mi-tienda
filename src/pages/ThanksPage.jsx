import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function ThanksPage() {
  return (
    <section className="state-message success-message">
      <CheckCircle size={52} strokeWidth={1.5} style={{ margin: "0 auto 16px", display: "block", color: "#27865d" }} />
      <p className="eyebrow">Pedido registrado</p>
      <h1>Gracias por tu pedido</h1>
      <p>Hemos recibido tu solicitud correctamente. El administrador podrá revisar el pedido en Google Sheets.</p>
      <Link className="button button-primary" to="/">Volver al catálogo</Link>
    </section>
  );
}
