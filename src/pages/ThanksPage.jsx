import { Link } from "react-router-dom";

export default function ThanksPage() {
  return (
    <section className="state-message success-message">
      <div className="success-mark" aria-hidden="true"></div>
      <p className="eyebrow">Pedido registrado</p>
      <h1>Gracias por tu pedido</h1>
      <p>Hemos recibido tu solicitud correctamente. El administrador podrá revisar el pedido en Google Sheets.</p>
      <Link className="button button-primary" to="/">Volver al catálogo</Link>
    </section>
  );
}
