
import { CONFIG } from "../config";

// REGISTRAR PEDIDO EN GOOGLE APPS SCRIPT
export async function sendOrder(order) {
  if (
    !CONFIG.APPS_SCRIPT_URL ||
    CONFIG.APPS_SCRIPT_URL.includes("[PEGAR_")
  ) {
    throw new Error("Configura APPS_SCRIPT_URL en src/config.js.");
  }

  const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
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
      result.message ||
      `No se pudo registrar el pedido (HTTP ${response.status}).`
    );
  }

  return result;
}

// ENVIAR NOTIFICACIÓN A NTFY
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

  const money = (value) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);

  const totalUnits = order.items.reduce(
    (sum, item) => sum + (Number(item.cantidad) || 0),
    0
  );

  const productLines = order.items.map((item) => {
    const quantity = Number(item.cantidad) || 0;
    return `• ${item.nombre}  × ${quantity}`;
  });

  const message = [
    "━━━━━━━━━━━━━━━━━━",
    "       NUEVO PEDIDO",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "👤 DATOS DEL CLIENTE",
    `Nombre: ${order.nombre || "No indicado"}`,
    `Contacto: ${order.contacto || "No indicado"}`,
    `Dirección: ${order.direccion || "No indicada"}`,
    ...(order.notas ? [`Notas: ${order.notas}`] : []),
    "",
    "🛍️ PRODUCTOS",
    ...productLines,
    "",
    `📦 ${totalUnits} unidades en total`,
    "",
    `💰 TOTAL: ${money(order.total)}`,
    "━━━━━━━━━━━━━━━━━━"
  ].join("\n");

  try {
    const response = await fetch(
      `https://ntfy.sh/${encodeURIComponent(topic)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
          "Title": "🛒 NUEVO PEDIDO | MI TIENDA",
          "Priority": "4",
          "Tags": "shopping_cart,bell"
        },
        body: message
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
