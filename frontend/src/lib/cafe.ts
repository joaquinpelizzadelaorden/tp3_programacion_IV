import type { Producto } from '../api/schemas'

export type Cafe = Extract<Producto, { tipo: 'expreso' | 'filtrado' }>
export type Bebida = Cafe['tipo']

export type EleccionCafe = {
  bebida?: Bebida
  tamanio?: string
  origen?: string
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
      producto.tamanio === tamanio &&
      producto.variedad.nombre === origen,
  )
}
