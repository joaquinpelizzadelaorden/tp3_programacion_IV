export function leerMesa(search: string): number | null {
  const valor = new URLSearchParams(search).get('mesa')
  if (valor === null || !/^\d+$/.test(valor)) return null

  const mesa = Number(valor)
  return Number.isSafeInteger(mesa) && mesa > 0 ? mesa : null
}
