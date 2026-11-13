import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";
import { notifyOrder, sendOrder } from "../utils/order";

function validContact(value) {
  const contact = value.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const phone = /^\+?[0-9\s().-]{7,}$/.test(contact);
  return email || phone;
}

function createOrderId() {
  if (globalThis.crypto && globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", contacto: "", direccion: "", notas: "" });
  const [orderId] = useState(createOrderId);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!items.length) return <section className="state-message"><h1>No hay productos para pedir</h1><Link to="/">Volver al catálogo</Link></section>;

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.nombre.trim()) return setError("Escribe tu nombre.");
    if (!validContact(form.contacto)) return setError("Introduce un email o teléfono válido.");
    if (!form.direccion.trim()) return setError("Introduce la dirección de entrega.");

    const order = {
      orderId,
      nombre: form.nombre.trim(),
      contacto: form.contacto.trim(),
      direccion: form.direccion.trim(),
      notas: form.notas.trim(),
      items: items.map(({ id, nombre, precio, cantidad }) => ({ id, nombre, precio, cantidad })),
      total: Number(total.toFixed(2))
    };

    setSending(true);
    try {
      await sendOrder(order);
      notifyOrder(order);
      clearCart();
      navigate("/gracias");
    } catch (err) {
      setError(err.message || "No se pudo enviar el pedido. Inténtalo nuevamente.");
      setSending(false);
    }
  }

  return (
    <section className="checkout-layout">
      <div>
        <p className="eyebrow">Último paso</p><h1>Finalizar pedido</h1>
        <form className="checkout-form" onSubmit={submit}>
          <label className="field"><span>Nombre *</span><input name="nombre" value={form.nombre} onChange={update} maxLength="120" required /></label>
          <label className="field"><span>Email o teléfono *</span><input name="contacto" value={form.contacto} onChange={update} maxLength="160" required /></label>
          <label className="field"><span>Dirección de entrega *</span><textarea name="direccion" rows="2" value={form.direccion} onChange={update} maxLength="300" required /></label>
          <label className="field"><span>Notas (opcional)</span><textarea name="notas" rows="4" value={form.notas} onChange={update} maxLength="1000" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-full" disabled={sending}>
            {sending ? <><span className="spinner" /> Enviando pedido…</> : "Confirmar pedido"}
          </button>
        </form>
      </div>
      <aside className="order-summary">
        <h2>Resumen del pedido</h2>
        {items.map((item) => <div className="summary-line" key={item.id}>
          <span>{item.nombre} × {item.cantidad}</span><strong>{formatCurrency(item.precio * item.cantidad)}</strong>
        </div>)}
        <div className="summary-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
      </aside>
    </section>
  );
}
