/**
 * Registra pedidos y valida precios contra la pestaña Productos.
 * El navegador nunca determina el precio ni el total definitivo.
 */
const SPREADSHEET_ID = "PEGAR_ID_DE_LA_HOJA";

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
function normalizedHeaders(values) {
  const result = {};
  values.forEach(function (value, index) {
    const key = String(value || "").trim().toLowerCase();
    if (key) result[key] = index;
  });
  return result;
}
function getColumn(headers, names) {
  for (var i = 0; i < names.length; i++) {
    if (Object.prototype.hasOwnProperty.call(headers, names[i])) return headers[names[i]];
  }
  return -1;
}
function isActive(value) {
  return ["TRUE", "1", "YES", "SI", "SÍ"].indexOf(String(value).trim().toUpperCase()) !== -1;
}
function parsePrice(value) {
  if (typeof value === "number") return value;
  var text = String(value == null ? "" : value).trim().replace(/\s/g, "");
  if (text.indexOf(",") !== -1 && text.indexOf(".") !== -1) {
    if (text.lastIndexOf(",") > text.lastIndexOf(".")) text = text.replace(/\./g, "").replace(",", ".");
    else text = text.replace(/,/g, "");
  } else text = text.replace(",", ".");
  return Number(text);
}
function safeSheetText(value, maxLength) {
  var text = String(value == null ? "" : value).trim().slice(0, maxLength);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  var lock;
  try {
    if (SPREADSHEET_ID === "PEGAR_ID_DE_LA_HOJA") throw new Error("El administrador debe configurar SPREADSHEET_ID en Apps Script.");
    if (!e || !e.postData || !e.postData.contents) throw new Error("No se recibió el contenido del pedido.");

    var order = JSON.parse(e.postData.contents);
    var nombre = safeSheetText(order.nombre, 120);
    var contacto = safeSheetText(order.contacto, 160);
    var direccion = safeSheetText(order.direccion, 300);
    var notas = safeSheetText(order.notas, 1000);
    if (!nombre || !contacto || !direccion) throw new Error("Nombre, contacto y dirección son obligatorios.");
    if (!Array.isArray(order.items) || order.items.length === 0 || order.items.length > 50) {
      throw new Error("El pedido debe contener entre 1 y 50 líneas de productos.");
    }

    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var productsSheet = spreadsheet.getSheetByName("Productos");
    var ordersSheet = spreadsheet.getSheetByName("Pedidos");
    if (!productsSheet) throw new Error('No existe la pestaña "Productos".');
    if (!ordersSheet) throw new Error('No existe la pestaña "Pedidos".');

    var productValues = productsSheet.getDataRange().getValues();
    if (productValues.length < 2) throw new Error("No hay productos registrados.");
    var productHeaders = normalizedHeaders(productValues[0]);
    var idCol = getColumn(productHeaders, ["id"]);
    var nameCol = getColumn(productHeaders, ["nombre"]);
    var priceCol = getColumn(productHeaders, ["precio"]);
    var activeCol = getColumn(productHeaders, ["activo"]);
    if ([idCol, nameCol, priceCol, activeCol].some(function (col) { return col < 0; })) {
      throw new Error('La pestaña "Productos" debe contener id, nombre, precio y activo.');
    }

    var productsById = {};
    for (var row = 1; row < productValues.length; row++) {
      var productRow = productValues[row];
      var productId = String(productRow[idCol] == null ? "" : productRow[idCol]).trim();
      if (!productId) continue;
      productsById[productId] = {
        id: productId,
        nombre: String(productRow[nameCol] || "").trim(),
        precio: parsePrice(productRow[priceCol]),
        activo: isActive(productRow[activeCol])
      };
    }

    var seen = {};
    var verifiedItems = [];
    var totalCents = 0;
    order.items.forEach(function (item) {
      var id = String(item && item.id != null ? item.id : "").trim();
      var quantity = Number(item && item.cantidad);
      if (!id || seen[id]) throw new Error("El pedido contiene un producto inválido o repetido.");
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        throw new Error("Cada cantidad debe ser un número entero entre 1 y 100.");
      }
      var product = productsById[id];
      if (!product || !product.activo) throw new Error("Uno de los productos ya no está disponible. Actualiza el catálogo.");
      if (!product.nombre || !Number.isFinite(product.precio) || product.precio < 0) {
        throw new Error("Hay un producto con datos de precio inválidos en la hoja.");
      }
      seen[id] = true;
      var priceCents = Math.round(product.precio * 100);
      var subtotalCents = priceCents * quantity;
      totalCents += subtotalCents;
      verifiedItems.push({
        id: product.id, nombre: product.nombre, precio: priceCents / 100,
        cantidad: quantity, subtotal: subtotalCents / 100
      });
    });

    var orderId = String(order.orderId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
    if (!orderId) throw new Error("El pedido no tiene un identificador válido.");
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error("El sistema está ocupado. Inténtalo nuevamente.");
    var cache = CacheService.getScriptCache();
    var cacheKey = "order_" + orderId;
    if (cache.get(cacheKey)) return jsonResponse({ status: "ok", duplicate: true });

    var orderValues = ordersSheet.getDataRange().getValues();
    if (!orderValues.length) throw new Error('La pestaña "Pedidos" debe tener encabezados en la primera fila.');
    var orderHeaders = normalizedHeaders(orderValues[0]);
    var timestampCol = getColumn(orderHeaders, ["timestamp"]);
    var orderNameCol = getColumn(orderHeaders, ["nombre"]);
    var contactCol = getColumn(orderHeaders, ["contacto"]);
    var addressCol = getColumn(orderHeaders, ["direccion"]);
    var notesCol = getColumn(orderHeaders, ["notas"]);
    var itemsCol = getColumn(orderHeaders, ["item", "items"]);
    var totalCol = getColumn(orderHeaders, ["total"]);
    var statusCol = getColumn(orderHeaders, ["estado"]);
    if ([timestampCol, orderNameCol, contactCol, addressCol, notesCol, itemsCol, totalCol, statusCol].some(function (col) { return col < 0; })) {
      throw new Error('La pestaña "Pedidos" debe tener: timestamp, nombre, contacto, direccion, notas, item, total y estado.');
    }

    var newRow = new Array(orderValues[0].length).fill("");
    newRow[timestampCol] = new Date();
    newRow[orderNameCol] = nombre;
    newRow[contactCol] = contacto;
    newRow[addressCol] = direccion;
    newRow[notesCol] = notas;
    newRow[itemsCol] = JSON.stringify(verifiedItems);
    newRow[totalCol] = totalCents / 100;
    newRow[statusCol] = "pendiente";
    ordersSheet.appendRow(newRow);
    cache.put(cacheKey, "saved", 21600);
    return jsonResponse({ status: "ok", total: totalCents / 100 });
  } catch (error) {
    return jsonResponse({ status: "error", message: error && error.message ? error.message : "Error interno al registrar el pedido." });
  } finally {
    if (lock) lock.releaseLock();
  }
}
