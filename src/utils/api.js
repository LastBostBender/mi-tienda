import { CONFIG } from "../config";
export async function apiRequest(payload) {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes("[PEGAR_")) throw new Error("Configura APPS_SCRIPT_URL en src/config.js.");
  const response = await fetch(CONFIG.APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
  const raw = await response.text(); let data;
  try { data = JSON.parse(raw); } catch { throw new Error("Respuesta inválida de Apps Script. Comprueba la URL /exec y el despliegue."); }
  if (!response.ok || data.status !== "ok") throw new Error(data.message || "No se pudo completar la operación.");
  return data;
}
