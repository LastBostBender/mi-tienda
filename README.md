# Tienda / catálogo con React + Vite

Aplicación educativa de catálogo y recepción de pedidos. El frontend es estático y se publica en GitHub Pages. Google Sheets funciona como fuente del catálogo y como panel administrativo de pedidos; Google Apps Script recibe los pedidos.

## 1. Arquitectura

- **React 18 + Vite + JavaScript:** interfaz de usuario.
- **React Router DOM v6 con HashRouter:** navegación compatible con GitHub Pages.
- **PapaParse:** lectura y transformación del CSV público.
- **CartContext:** estado global del carrito y persistencia en `localStorage`.
- **Google Sheets publicado como CSV:** catálogo de solo lectura.
- **Google Apps Script:** endpoint HTTP que registra pedidos en la pestaña `Pedidos`.
- **ntfy:** notificación secundaria cuando el pedido se registra correctamente.
- **GitHub Pages:** alojamiento estático del frontend.

No existe login ni panel administrativo web. El administrador revisa y gestiona los pedidos directamente en la hoja de cálculo.

## 2. Estructura

```text
tienda-react-vite/
├── apps-script/
│   └── Code.gs
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── config.js
    ├── components/
    │   ├── Header.jsx
    │   └── ProductCard.jsx
    ├── context/
    │   ├── CartContext.jsx
    │   └── ProductsContext.jsx
    ├── hooks/
    │   └── useCurrency.js
    ├── pages/
    │   ├── CatalogPage.jsx
    │   ├── ProductPage.jsx
    │   ├── CartPage.jsx
    │   ├── CheckoutPage.jsx
    │   └── ThanksPage.jsx
    ├── styles/
    │   └── global.css
    └── utils/
        └── order.js
```

## 3. Crear Google Sheet para el catálogo

1. Crea una hoja de cálculo de Google.
2. Crea una pestaña llamada `Productos`.
3. En la primera fila escribe exactamente estas columnas:

   `id | nombre | descripcion | precio | imagen_url | categoria | activo`

4. Añade tus productos debajo. Usa identificadores únicos. El campo `activo` debe contener `TRUE` o `FALSE`. Solo se muestran filas con `TRUE`.
5. En Google Sheets, publica la pestaña como CSV desde **Archivo > Compartir > Publicar en la web** (la denominación puede variar según la interfaz).
6. Selecciona la pestaña `Productos` y el formato CSV.
7. Copia la URL pública resultante. Debe tener un formato similar a:

   `https://docs.google.com/spreadsheets/d/e/ID/pub?gid=GID&single=true&output=csv`

No introduzcas productos ficticios en el código: el catálogo se carga exclusivamente desde esta URL.

## 4. Crear la hoja de pedidos

En el mismo archivo de Google Sheets, crea una segunda pestaña llamada exactamente `Pedidos`. Puedes colocar estos encabezados en la primera fila:

`timestamp | nombre | contacto | notas | items | total | estado`

El Apps Script añade una fila por pedido, en ese orden. La columna `items` almacena el arreglo de productos como texto JSON y `estado` se inicializa en `pendiente`.

## 5. Desplegar Google Apps Script

1. Abre **Extensiones > Apps Script** desde la hoja de cálculo.
2. Sustituye el contenido del editor por el código de `apps-script/Code.gs`.
3. En `SPREADSHEET_ID`, pega el ID del archivo de Google Sheets. Es el fragmento entre `/d/` y `/edit` en la URL de la hoja.
4. Guarda el proyecto.
5. Selecciona **Implementar > Nueva implementación**.
6. Tipo: **Aplicación web**.
7. Ejecutar como: **Yo**.
8. Acceso: **Cualquiera**.
9. Implementa y autoriza los permisos solicitados.
10. Copia la URL de la aplicación web terminada en `/exec`.

Si modificas el Apps Script después de desplegarlo, crea una nueva versión de la implementación o actualiza la implementación existente para que los cambios estén activos.

### Código completo de Apps Script

El código ejecutable está también en `apps-script/Code.gs`:

```javascript
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
```

**Nota:** Apps Script puede redirigir la respuesta a un dominio de Google. El navegador sigue el redirect de `fetch`; si la configuración o las políticas del navegador bloquean la respuesta, revisa la consola del navegador y los permisos de despliegue.

## 6. Configurar ntfy

1. Elige un topic difícil de adivinar en [ntfy.sh](https://ntfy.sh/).
2. Suscríbete a ese mismo topic desde la aplicación ntfy o desde su web.
3. Copia el nombre del topic (no hace falta instalar un paquete npm).
4. La app enviará una notificación HTTP POST después de que Apps Script confirme `status: "ok"`.

El fallo de ntfy no revierte el pedido ni bloquea la navegación. Para topics públicos, cualquiera que conozca el nombre puede suscribirse o publicar; elige un identificador no predecible y considera las implicaciones de privacidad. No incluyas datos sensibles en el resumen de notificación.

## 7. Configurar el frontend

Edita `src/config.js`:

```javascript
export const CONFIG = {
  CSV_URL: "https://docs.google.com/spreadsheets/d/e/ID/pub?gid=GID&single=true&output=csv",
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/ID/exec",
  NTFY_TOPIC: "tu-topic-no-predecible"
};
```

Reemplaza cada valor de ejemplo por el valor real. Estos valores son configuración pública del frontend; no coloques contraseñas, claves privadas ni secretos en este archivo.

Edita también `vite.config.js` y cambia `NOMBRE_REPO` por el nombre exacto del repositorio GitHub. Por ejemplo, si la URL final es `https://usuario.github.io/mi-tienda/`, usa `base: "/mi-tienda/"`.

## 8. Instalar y ejecutar localmente

Necesitas Node.js y npm instalados.

```bash
npm install
npm run dev
```

Vite mostrará una URL local, normalmente `http://localhost:5173/`. Abre esa dirección en el navegador.

Para comprobar la versión de producción localmente:

```bash
npm run build
npm run preview
```

## 9. Subir el proyecto y publicar en GitHub Pages

1. Crea un repositorio vacío en GitHub (por ejemplo, `mi-tienda`). No agregues README, licencia ni `.gitignore` desde GitHub, porque el proyecto ya contiene esos archivos.
2. Sube todos los archivos y carpetas de este proyecto a la rama `main`, conservando también la carpeta oculta `.github/workflows/`.
3. En GitHub, abre **Settings > Pages**.
4. En **Build and deployment**, selecciona **GitHub Actions** como fuente.
5. Abre la pestaña **Actions** del repositorio y espera a que termine el flujo **Publicar en GitHub Pages**.
6. Cuando el flujo finalice correctamente, la web estará disponible en `https://USUARIO.github.io/NOMBRE_REPO/`.

Cada nuevo commit enviado a `main` volverá a compilar y publicar la aplicación automáticamente. No necesitas ejecutar `npm run deploy` ni instalar `gh-pages` en tu ordenador. El archivo `.github/workflows/deploy.yml` contiene la automatización.

## 10. Flujo de un pedido

1. El cliente abre el catálogo; React obtiene el CSV y PapaParse transforma sus filas.
2. Solo se muestran productos cuyo campo `activo` sea `TRUE`.
3. El cliente añade productos al carrito. `CartContext` guarda el estado en `localStorage`.
4. En checkout se valida nombre y contacto.
5. La aplicación envía el JSON al Apps Script con `Content-Type: text/plain;charset=utf-8`. Se usa `text/plain` para evitar el preflight CORS que suele disparar `application/json` en este patrón; el cuerpo sigue siendo `JSON.stringify(order)`.
6. Apps Script registra el pedido en `Pedidos` y responde `status: "ok"`.
7. La aplicación dispara la notificación ntfy sin esperar su resultado, vacía el carrito y navega a la confirmación.

## 11. Notas y límites del proyecto

- No hay autenticación de clientes ni panel web de administración.
- La URL CSV debe estar publicada y ser accesible desde el navegador.
- Las imágenes deben estar disponibles mediante URLs públicas y permitir su carga desde otros sitios.
- La validación del frontend es básica y didáctica. Para un sistema de producción harían falta controles adicionales contra manipulación de precios, spam, pedidos duplicados y abuso del endpoint.
- El frontend no puede mantener secretos: cualquier valor incluido en `src/config.js` es visible para quien inspeccione los archivos descargados.
- La aplicación no incluye datos de productos de demostración. Si la hoja no contiene filas activas, se presenta el estado de catálogo vacío.
