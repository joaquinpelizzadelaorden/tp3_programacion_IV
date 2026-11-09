export function formatearPrecio(valor: number): string {
  const entero = Math.round(valor).toString()
  return `$${entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}
