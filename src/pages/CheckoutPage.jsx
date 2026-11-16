import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../hooks/useCurrency";
import { notifyOrder, sendOrder } from "../utils/order";
import { ArrowLeft } from "lucide-react";

const MINIMUM_ORDER = 50;
function validPhone(value) {
  const digits = String(value || "").replace(/\\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
function createOrderId() {
  if (globalThis.crypto && globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ compradorNombre: "", compradorTelefono: "", recibeNombre: "", recibeTelefono: "", direccion: "", notas: "" });
  const [orderId] = useState(createOrderId);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const enough = total >= MINIMUM_ORDER;
  const missing = Math.max(0, MINIMUM_ORDER - total);

  if (!items.length) return <section className="state-message"><h1>No hay productos para pedir</h1><Link to="/">Volver al catálogo</Link></section>;
  if (!enough) return <section className="state-message">
    <h1>Pedido mínimo no alcanzado</h1>
    <p>El pedido mínimo es {formatCurrency(MINIMUM_ORDER)}. Añade {formatCurrency(missing)} más para finalizar.</p>
    <Link className="button button-primary" to="/carrito">Volver al carrito</Link>
  </section>;

  function update(e) { setForm(previous => ({ ...previous, [e.target.name]: e.target.value })); }
  async function submit(e) {
    e.preventDefault(); setError("");
    if (total < MINIMUM_ORDER) return setError(`El pedido mínimo es ${formatCurrency(MINIMUM_ORDER)}.`);
    if (!form.compradorNombre.trim()) return setError("Escribe los nombres y apellidos del comprador.");
    if (!validPhone(form.compradorTelefono)) return setError("Introduce un teléfono válido del comprador (entre 7 y 15 dígitos).");
    if (!form.recibeNombre.trim()) return setError("Escribe los nombres y apellidos de quien recibe el pedido.");
    if (!validPhone(form.recibeTelefono)) return setError("Introduce un teléfono válido de quien recibe el pedido (entre 7 y 15 dígitos).");
    if (!form.direccion.trim()) return setError("Introduce la dirección de entrega.");

    const order = {
      orderId, compradorNombre: form.compradorNombre.trim(), compradorTelefono: form.compradorTelefono.trim(),
      recibeNombre: form.recibeNombre.trim(), recibeTelefono: form.recibeTelefono.trim(),
      direccion: form.direccion.trim(), notas: form.notas.trim(),
      nombre: form.compradorNombre.trim(), contacto: form.compradorTelefono.trim(),
      items: items.map(({ id, nombre, precio, cantidad }) => ({
        id, nombre, precio: Number(precio), cantidad: Math.max(1, parseInt(cantidad, 10) || 1)
      })),
      total: Number(total.toFixed(2))
    };
    setSending(true);
    try {
      await sendOrder(order);
      const ntfy = await notifyOrder(order);
      clearCart(); navigate("/gracias", { state: { ntfy } });
    } catch (err) {
      setError(err.message || "No se pudo enviar el pedido. Inténtalo nuevamente.");
      setSending(false);
    }
  }

  return <section className="checkout-layout">
    <div>
      <Link to="/carrito" className="back-link"><ArrowLeft size={14} /> Volver al carrito</Link>
      <h1>Finalizar pedido</h1>
      <form className="checkout-form" onSubmit={submit}>
        <h2>Datos del comprador</h2>
        <label className="field"><span>Nombres y apellidos del comprador *</span>
          <input name="compradorNombre" value={form.compradorNombre} onChange={update} maxLength="120" autoComplete="name" required /></label>
        <label className="field"><span>Teléfono del comprador *</span>
          <input name="compradorTelefono" type="tel" inputMode="tel" value={form.compradorTelefono} onChange={update} maxLength="30" autoComplete="tel" required /></label>
        <h2>Datos de quien recibe</h2>
        <label className="field"><span>Nombres y apellidos de quien recibe *</span>
          <input name="recibeNombre" value={form.recibeNombre} onChange={update} maxLength="120" required /></label>
        <label className="field"><span>Teléfono de quien recibe *</span>
          <input name="recibeTelefono" type="tel" inputMode="tel" value={form.recibeTelefono} onChange={update} maxLength="30" required /></label>
        <label className="field"><span>Dirección de entrega *</span>
          <textarea name="direccion" rows="2" value={form.direccion} onChange={update} maxLength="300" required /></label>
        <label className="field"><span>Notas (opcional)</span>
          <textarea name="notas" rows="3" value={form.notas} onChange={update} maxLength="1000" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-full" disabled={sending || !enough}>
          {sending ? <><span className="spinner" /> Enviando pedido…</> : "Confirmar pedido"}
        </button>
      </form>
    </div>
    <aside className="order-summary">
      <h2>Resumen del pedido</h2>
      <div className="summary-customer">
        {form.compradorNombre && <div className="summary-customer-row"><span>Comprador</span><strong>{form.compradorNombre}</strong></div>}
        {form.compradorTelefono && <div className="summary-customer-row"><span>Teléfono comprador</span><strong>{form.compradorTelefono}</strong></div>}
        {form.recibeNombre && <div className="summary-customer-row"><span>Recibe</span><strong>{form.recibeNombre}</strong></div>}
        {form.recibeTelefono && <div className="summary-customer-row"><span>Teléfono recibe</span><strong>{form.recibeTelefono}</strong></div>}
        {form.direccion && <div className="summary-customer-row"><span>Dirección</span><strong>{form.direccion}</strong></div>}
      </div>
      <h3 className="summary-items-title">Productos</h3>
      {items.map(item => <div className="summary-line" key={item.id}>
        <span className="summary-line-name">{item.nombre}<em className="summary-line-qty"> × {item.cantidad}</em></span>
        <strong>{formatCurrency(item.precio * item.cantidad)}</strong>
      </div>)}
      <div className="summary-total"><span>Total a pagar</span><strong>{formatCurrency(total)}</strong></div>
    </aside>
  </section>;
}
