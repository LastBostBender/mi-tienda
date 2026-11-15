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

export async function notifyOrder(order) {
  const topic = (CONFIG.NTFY_TOPIC || "").trim();
  if (!topic || topic.includes("[PEGAR_")) return;

  const fmt = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  const totalUnits = order.items.reduce((s, i) => s + i.cantidad, 0);

  const itemLines = order.items
    .map((i) => `  • ${i.nombre} × ${i.cantidad}  —  ${fmt(i.precio * i.cantidad)}`)
    .join("\n");

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

  // Limpia el topic por si acaso trae el dominio
  const cleanTopic = topic.replace(/^https?:\/\/ntfy\.sh\//i, "").replace(/^ntfy\.sh\//i, "");

  // Headers HTTP para metadatos (title, priority, tags) y body texto plano.
  // Formato compatible con todas las versiones de ntfy.apk.
  try {
    const headers = {
      "Title": "Nuevo pedido — Mi Tienda",
      "Priority": "high",
      "Tags": "shopping_cart,bell",
    };
    if (CONFIG.NTFY_TOKEN) headers["Authorization"] = `Bearer ${CONFIG.NTFY_TOKEN}`;
    const res = await fetch(`https://ntfy.sh/${cleanTopic}`, {
      method: "POST",
      headers,
      body: message
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, status: res.status, detail };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, detail: err.message };
  }
}
