import type { Producto } from '../api/schemas'

export type ItemCarrito = {
  producto: Producto
  cantidad: number
}

export type Carrito = readonly ItemCarrito[]

export type AccionCarrito =
  | { type: 'agregar'; producto: Producto }
  | { type: 'sumar'; productoId: string }
  | { type: 'restar'; productoId: string }
  | { type: 'quitar'; productoId: string }
  | { type: 'vaciar' }

export const carritoInicial: Carrito = []

function cambiarCantidad(carrito: Carrito, productoId: string, diferencia: number): Carrito {
  return carrito.flatMap((item) => {
    if (item.producto.id !== productoId) return [item]
    const cantidad = item.cantidad + diferencia
    return cantidad > 0 ? [{ ...item, cantidad }] : []
  })
}

export function carritoReducer(carrito: Carrito, accion: AccionCarrito): Carrito {
  switch (accion.type) {
    case 'agregar': {
      const yaEsta = carrito.some((item) => item.producto.id === accion.producto.id)
      return yaEsta
        ? cambiarCantidad(carrito, accion.producto.id, 1)
        : [...carrito, { producto: accion.producto, cantidad: 1 }]
    }
    case 'sumar':
      return cambiarCantidad(carrito, accion.productoId, 1)
    case 'restar':
      return cambiarCantidad(carrito, accion.productoId, -1)
    case 'quitar':
      return carrito.filter((item) => item.producto.id !== accion.productoId)
    case 'vaciar':
      return []
  }
}

export function subtotalItem(item: ItemCarrito): number {
  return item.producto.precio * item.cantidad
}

export function subtotalCarrito(carrito: Carrito): number {
  return carrito.reduce((suma, item) => suma + subtotalItem(item), 0)
}
