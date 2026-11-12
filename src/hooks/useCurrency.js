export function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD"
  }).format(Number(value) || 0);
}
