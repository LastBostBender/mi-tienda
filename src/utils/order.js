
import { CONFIG } from "../config";

export async function sendOrder(order) {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes("[PEGAR_")) {
    throw new Error("Configura APPS_SCRIPT_URL en src/config.js.");
  }

  const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(order)
  });

  const responseText = await response.text();
  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      "El servidor no devolvió una respuesta JSON válida. Comprueba el despliegue de Apps Script."
    );
  }

  if (!response.ok || result.status !== "ok") {
    throw new Error(
      result.message || `No se pudo registrar el pedido (HTTP ${response.status}).`
    );
  }

  return result;
}

export async function notifyOrder(order) {
  const topic = (CONFIG.NTFY_TOPIC || "")
    .trim()
    .replace(/^https?:\/\/ntfy\.sh\//i, "")
    .replace(/^ntfy\.sh\//i, "")
    .replace(/\/+$/, "");

  if (!topic || topic.includes("[PEGAR_")) {
    return {
      ok: false,
      status: 0,
      detail: "El topic de ntfy no está configurado."
    };
  }

  if (!Array.isArray(order?.items) || order.items.length === 0) {
    return {
      ok: false,
      status: 0,
      detail: "El pedido no contiene productos."
    };
  }

  const fmt = (value) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);

  const totalUnits = order.items.reduce(
    (sum, item) => sum + (Number(item.cantidad) || 0),
    0
  );

  const productLines = order.items.map((item, index) => {
    const quantity = Number(item.cantidad) || 0;
    const subtotal = (Number(item.precio) || 0) * quantity;

    return `${index + 1}. ${item.nombre}
   ${quantity} unidad(es) × ${fmt(item.precio)} = ${fmt(subtotal)}`;
  });

  const message = [
    "🛍️ RESUMEN DEL PEDIDO",
    "",
    "👤 DATOS DEL CLIENTE",
    `Nombre: ${order.nombre || "No indicado"}`,
    `Contacto: ${order.contacto || "No indicado"}`,
    `Dirección: ${order.direccion || "No indicada"}`,
    ...(order.notas ? [`Observaciones: ${order.notas}`] : []),
    "",
    "📦 PRODUCTOS",
    ...productLines,
    "",
    "━━━━━━━━━━━━━━━━",
    `🧾 Total de unidades: ${totalUnits}`,
    `💰 TOTAL A PAGAR: ${fmt(order.total)}`,
    "━━━━━━━━━━━━━━━━"
  ].join("\n");

  try {
    const response = await fetch(
      `https://ntfy.sh/${encodeURIComponent(topic)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic,
          title: "🛒 NUEVO PEDIDO | MI TIENDA",
          message,
          priority: 4,
          tags: ["shopping_cart", "bell"]
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");

      return {
        ok: false,
        status: response.status,
        detail: detail || "ntfy rechazó la notificación."
      };
    }

    return {
      ok: true,
      status: response.status,
      topic
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      detail: error.message || "No se pudo conectar con ntfy."
    };
  }
}
