
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
  const topic = (CONFIG.NTFY_TOPIC || "").trim()
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

  const fmt = (n) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(n);

  const totalUnits = order.items.reduce(
    (sum, item) => sum + Number(item.cantidad || 0),
    0
  );

  const itemLines = order.items
    .map(
      (item) =>
        `• ${item.nombre} × ${item.cantidad} — ${fmt(
          item.precio * item.cantidad
        )}`
    )
    .join("\n");

  const message = [
    `Cliente: ${order.nombre || ""}`,
    `Contacto: ${order.contacto || ""}`,
    `Dirección: ${order.direccion || ""}`,
    order.notas ? `Notas: ${order.notas}` : null,
    "",
    `Productos (${totalUnits} unidades):`,
    itemLines,
    "",
    `TOTAL: ${fmt(order.total)}`
  ]
    .filter((line) => line !== null)
    .join("\n");

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
          title: "Nuevo pedido - Mi Tienda",
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
