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
    throw new Error("El servidor no devolvió una respuesta JSON válida. Comprueba el despliegue de Apps Script.");
  }

  if (!response.ok || result.status !== "ok") {
    throw new Error(result.message || `No se pudo registrar el pedido (HTTP ${response.status}).`);
  }
  return result;
}

export function notifyOrder(order) {
  if (!CONFIG.NTFY_TOPIC || CONFIG.NTFY_TOPIC.includes("[PEGAR_")) return;

  const fmt = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  const itemLines = order.items
    .map((i) => `  • ${i.nombre} × ${i.cantidad}  —  ${fmt(i.precio * i.cantidad)}`)
    .join("\n");

  const totalUnits = order.items.reduce((s, i) => s + i.cantidad, 0);

  const message = [
    `👤 ${order.nombre}`,
    `📞 ${order.contacto}`,
    `📍 ${order.direccion}`,
    order.notas ? `📝 ${order.notas}` : null,
    ``,
    `🛍️ Productos (${totalUnits} unidad${totalUnits !== 1 ? "es" : ""}):`,
    itemLines,
    ``,
    `💰 Total: ${fmt(order.total)}`,
  ].filter((l) => l !== null).join("\n");

  fetch(`https://ntfy.sh/${encodeURIComponent(CONFIG.NTFY_TOPIC)}`, {
    method: "POST",
    headers: {
      Title: "🛒 Nuevo pedido — Mi Tienda",
      Priority: "4",
      Tags: "shopping_cart,bell"
    },
    body: message
  }).catch((err) => console.warn("No se pudo enviar la notificación ntfy:", err));
}
