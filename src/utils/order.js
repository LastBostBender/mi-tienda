import { CONFIG } from "../config";

export async function sendOrder(order) {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes("[PEGAR_")) {
    throw new Error("Configura APPS_SCRIPT_URL en src/config.js.");
  }

  // text/plain evita el preflight CORS en el patrón habitual de Google Apps Script.
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

  const itemCount = order.items.reduce((sum, item) => sum + item.cantidad, 0);
  const message = `Cliente: ${order.nombre}\nTotal: ${order.total.toFixed(2)}\nUnidades: ${itemCount}`;

  // La notificación es secundaria: un fallo no invalida el pedido guardado.
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
