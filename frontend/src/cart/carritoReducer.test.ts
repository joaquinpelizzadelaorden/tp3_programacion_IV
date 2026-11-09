import { describe, expect, it } from 'vitest'
import type { Producto } from '../api/schemas'
import {
  carritoInicial,
  carritoReducer,
  subtotalCarrito,
  subtotalItem,
} from './carritoReducer'
import type { Carrito } from './carritoReducer'

const expreso: Producto = {
  id: 'c5',
  tipo: 'expreso',
  nombre: 'Expreso Mediano Colombia',
  tamanio: 'Mediano',
  variedad: {
    nombre: 'Colombia',
    descripcion: 'Acidez media, cuerpo equilibrado y notas cítricas y florales',
  },
  precio: 7360,
}

const muffin: Producto = {
  id: 'p1',
  tipo: 'pasteleria',
  nombre: 'Muffin de chocolate',
  precio: 2500,
}

describe('carritoReducer', () => {
  it('empieza vacío', () => {
    expect(carritoInicial).toEqual([])
  })

  it('agregar un producto nuevo lo suma con cantidad 1', () => {
    const carrito = carritoReducer(carritoInicial, { type: 'agregar', producto: expreso })

    expect(carrito).toEqual([{ producto: expreso, cantidad: 1 }])
  })

  it('agregar un producto que ya está suma 1 a su cantidad sin duplicar la línea', () => {
    const uno = carritoReducer(carritoInicial, { type: 'agregar', producto: expreso })
    const dos = carritoReducer(uno, { type: 'agregar', producto: expreso })

    expect(dos).toEqual([{ producto: expreso, cantidad: 2 }])
  })

  it('mantiene el orden en que se agregaron los productos', () => {
    const a = carritoReducer(carritoInicial, { type: 'agregar', producto: expreso })
    const b = carritoReducer(a, { type: 'agregar', producto: muffin })
    const c = carritoReducer(b, { type: 'agregar', producto: expreso })

    expect(c.map((item) => item.producto.id)).toEqual(['c5', 'p1'])
  })

  it('sumar aumenta la cantidad en 1', () => {
    const carrito: Carrito = [{ producto: expreso, cantidad: 2 }]

    expect(carritoReducer(carrito, { type: 'sumar', productoId: 'c5' })).toEqual([
      { producto: expreso, cantidad: 3 },
    ])
  })

  it('restar baja la cantidad en 1', () => {
    const carrito: Carrito = [{ producto: expreso, cantidad: 3 }]

    expect(carritoReducer(carrito, { type: 'restar', productoId: 'c5' })).toEqual([
      { producto: expreso, cantidad: 2 },
    ])
  })

  it('restar con cantidad 1 quita el producto: nunca queda una cantidad en 0', () => {
    const carrito: Carrito = [
      { producto: expreso, cantidad: 1 },
      { producto: muffin, cantidad: 1 },
    ]

    expect(carritoReducer(carrito, { type: 'restar', productoId: 'c5' })).toEqual([
      { producto: muffin, cantidad: 1 },
    ])
  })

  it('quitar elimina el producto sin importar su cantidad', () => {
    const carrito: Carrito = [
      { producto: expreso, cantidad: 5 },
      { producto: muffin, cantidad: 1 },
    ]

    expect(carritoReducer(carrito, { type: 'quitar', productoId: 'c5' })).toEqual([
      { producto: muffin, cantidad: 1 },
    ])
  })

  it('vaciar deja el carrito sin productos', () => {
    const carrito: Carrito = [
      { producto: expreso, cantidad: 2 },
      { producto: muffin, cantidad: 1 },
    ]

    expect(carritoReducer(carrito, { type: 'vaciar' })).toEqual([])
  })

  it('sumar, restar y quitar un producto que no está no cambian el carrito', () => {
    const carrito: Carrito = [{ producto: expreso, cantidad: 2 }]

    for (const type of ['sumar', 'restar', 'quitar'] as const) {
      expect(carritoReducer(carrito, { type, productoId: 'zzz' })).toEqual(carrito)
    }
  })

  it('es puro: no modifica el carrito que recibe', () => {
    const carrito: Carrito = Object.freeze([
      Object.freeze({ producto: expreso, cantidad: 1 }),
    ])

    expect(() => {
      carritoReducer(carrito, { type: 'agregar', producto: expreso })
      carritoReducer(carrito, { type: 'agregar', producto: muffin })
      carritoReducer(carrito, { type: 'sumar', productoId: 'c5' })
      carritoReducer(carrito, { type: 'restar', productoId: 'c5' })
      carritoReducer(carrito, { type: 'quitar', productoId: 'c5' })
      carritoReducer(carrito, { type: 'vaciar' })
    }).not.toThrow()
    expect(carrito).toEqual([{ producto: expreso, cantidad: 1 }])
  })
})

describe('subtotales (orientativos)', () => {
  it('subtotalItem multiplica el precio por la cantidad', () => {
    expect(subtotalItem({ producto: expreso, cantidad: 2 })).toBe(14720)
  })

  it('subtotalCarrito suma los subtotales de todas las líneas', () => {
    const carrito: Carrito = [
      { producto: expreso, cantidad: 2 },
      { producto: muffin, cantidad: 1 },
    ]

    expect(subtotalCarrito(carrito)).toBe(17220)
  })

  it('subtotalCarrito de un carrito vacío es 0', () => {
    expect(subtotalCarrito(carritoInicial)).toBe(0)
  })
})
