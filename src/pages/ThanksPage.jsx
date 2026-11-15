import { Link, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function ThanksPage() {
  const { state } = useLocation();
  const ntfy = state?.ntfy;

  return (
    <section className="state-message success-message">
      <CheckCircle size={52} strokeWidth={1.5} style={{ margin: "0 auto 16px", display: "block", color: "#27865d" }} />
      <p className="eyebrow">Pedido registrado</p>
      <h1>Gracias por tu pedido</h1>
      <p>Hemos recibido tu solicitud correctamente. El administrador podrá revisar el pedido en Google Sheets.</p>

      {ntfy && (
        <p style={{
          marginTop: "1rem", padding: "8px 12px", borderRadius: "6px", fontSize: ".8rem",
          background: ntfy.ok ? "rgba(39,134,93,.12)" : "rgba(157,48,43,.12)",
          color: ntfy.ok ? "#27865d" : "#9d302b",
          border: `1px solid ${ntfy.ok ? "#27865d" : "#9d302b"}`,
          wordBreak: "break-all"
        }}>
          ntfy: {ntfy.ok ? `✓ OK (HTTP ${ntfy.status})` : `✗ HTTP ${ntfy.status}${ntfy.detail ? " — " + ntfy.detail : ""}`}
        </p>
      )}

      <Link className="button button-primary" to="/" style={{ marginTop: "1rem" }}>Volver al catálogo</Link>
    </section>
  );
}
