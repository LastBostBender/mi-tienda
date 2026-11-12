import { CONFIG } from "../config";

export async function sendOrder(order) {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes("[PEGAR_")) {
    throw new Error("Configura APPS_SCRIPT_URL en src/config.js.");
  }

  // Apps Script puede provocar un preflight CORS con application/json.
  // text/plain evita ese preflight en este patrón; el contenido sigue siendo JSON.
  const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(order)
  });

  const result = await response.json();
  if (!response.ok || result.status !== "ok") {
    throw new Error(result.message || "No se pudo registrar el pedido.");
  }
  return result;
}

export function notifyOrder(order) {
  if (!CONFIG.NTFY_TOPIC || CONFIG.NTFY_TOPIC.includes("[PEGAR_")) return;

  const itemCount = order.items.reduce((sum, item) => sum + item.cantidad, 0);
  const message = `Cliente: ${order.nombre}\nTotal: ${order.total.toFixed(2)}\nUnidades: ${itemCount}`;

  // Notificación secundaria: no debe retrasar ni invalidar un pedido ya registrado.
  fetch(`https://ntfy.sh/${encodeURIComponent(CONFIG.NTFY_TOPIC)}`, {
    method: "POST",
    headers: {
      Title: "Nuevo pedido",
      Priority: "4",
      Tags: "shopping_cart"
    },
    body: message
  }).catch((error) => console.warn("No se pudo enviar la notificación ntfy:", error));
}
