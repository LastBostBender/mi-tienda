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

  // Se usa JSON para evitar el preflight CORS que generan los headers ntfy
  // (Title, Priority, Tags). Con Content-Type application/json ntfy los acepta
  // en el cuerpo y la petición es simple (no dispara OPTIONS).
  try {
    const headers = { "Content-Type": "application/json" };
    if (CONFIG.NTFY_TOKEN) headers["Authorization"] = `Bearer ${CONFIG.NTFY_TOKEN}`;
    const res = await fetch(`https://ntfy.sh/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        topic: cleanTopic,
        title: "Nuevo pedido — Mi Tienda",
        message,
        priority: 4,
        tags: ["shopping_cart", "bell"]
      })
    });
    if (!res.ok) {
      console.warn(`ntfy respondió con HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn("No se pudo enviar la notificación ntfy:", err.message);
  }
}
