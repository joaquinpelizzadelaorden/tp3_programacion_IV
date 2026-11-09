import type { Producto } from '../api/schemas'

export type Cafe = Extract<Producto, { tipo: 'expreso' | 'filtrado' }>
export type Bebida = Cafe['tipo']

const DESCRIPCIONES_ORIGEN: Record<string, string> = {
  Brasil: 'Acidez baja, cuerpo denso y notas de chocolate y frutos secos',
  Colombia: 'Acidez media, cuerpo equilibrado y notas cítricas y florales',
  Etiopía: 'Acidez alta, cuerpo ligero y notas frutales y florales',
}

export type EleccionCafe = {
  bebida?: Bebida
  tamanio?: string
  origen?: string
}

export function obtenerTamanio(cafe: Cafe): string | undefined {
  return cafe.tamanio ?? cafe.nombre.match(/\b(Pocillo|Mediano|Taza Grande)\b/i)?.[1]
}

export function obtenerOrigen(cafe: Cafe): string | undefined {
  return cafe.variedad?.nombre ?? Object.keys(DESCRIPCIONES_ORIGEN).find((origen) =>
    cafe.nombre.toLocaleLowerCase().includes(origen.toLocaleLowerCase()),
  )
}

export function obtenerDescripcionOrigen(cafe: Cafe): string | undefined {
  const origen = obtenerOrigen(cafe)
  return cafe.variedad?.descripcion ?? (origen ? DESCRIPCIONES_ORIGEN[origen] : undefined)
}

export function buscarCafe(
  productos: readonly Producto[],
  eleccion: EleccionCafe,
): Cafe | undefined {
  const { bebida, tamanio, origen } = eleccion
  if (bebida === undefined || tamanio === undefined || origen === undefined) return undefined

  return productos.find(
    (producto): producto is Cafe =>
      producto.tipo !== 'pasteleria' &&
      producto.tipo === bebida &&
      obtenerTamanio(producto) === tamanio &&
      obtenerOrigen(producto) === origen,
  )
}
