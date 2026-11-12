/**
 * Endpoint de escritura de pedidos.
 * Sustituye SPREADSHEET_ID por el ID de tu Google Sheet.
 */
const SPREADSHEET_ID = "PEGAR_ID_DE_LA_HOJA";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No se recibió el contenido del pedido.");
    }

    const order = JSON.parse(e.postData.contents);
    if (!order.nombre || !order.contacto || !Array.isArray(order.items)) {
      throw new Error("El pedido no contiene los campos requeridos.");
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName("Pedidos");
    if (!sheet) throw new Error('No existe la pestaña "Pedidos".');

    sheet.appendRow([
      new Date(),
      order.nombre,
      order.contacto,
      order.notas || "",
      JSON.stringify(order.items),
      Number(order.total) || 0,
      "pendiente"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.message || "Error interno al registrar el pedido."
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
