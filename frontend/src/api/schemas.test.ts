import { describe, expect, it } from 'vitest'
import {crearPedidoRespuestaSchema, errorSchema, pedidoSchema, productoSchema, productosSchema } from './schemas'

const expresoMediano = {
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

const muffin = {
  id: 'p1',
  tipo: 'pasteleria',
  nombre: 'Muffin de chocolate',
  precio: 2500,
}

describe('productoSchema', () => {
  it('acepta un café con tamaño y variedad', () => {
    expect(productoSchema.parse(expresoMediano)).toEqual(expresoMediano)
  })

  it('acepta una pieza de pastelería sin tamaño ni variedad', () => {
    expect(productoSchema.parse(muffin)).toEqual(muffin)
  })

  it('ignora los campos extra que el front no usa', () => {
    const conExtras = { ...expresoMediano, precioBase: 2500, gramos: 27 }
    expect(productoSchema.parse(conExtras)).toEqual(expresoMediano)
  })

  it('rechaza un café sin variedad', () => {
    const sinVariedad = { ...expresoMediano, variedad: undefined }
    expect(productoSchema.safeParse(sinVariedad).success).toBe(false)
  })

  it('rechaza un tipo desconocido', () => {
    expect(productoSchema.safeParse({ ...muffin, tipo: 'bebida' }).success).toBe(false)
  })

  it('rechaza un precio que no es número', () => {
    expect(productoSchema.safeParse({ ...muffin, precio: '2500' }).success).toBe(false)
  })
})

describe('productosSchema', () => {
  it('acepta una lista de productos', () => {
    expect(productosSchema.parse([expresoMediano, muffin])).toHaveLength(2)
  })

  it('acepta una lista vacía', () => {
    expect(productosSchema.parse([])).toEqual([])
  })

  it('rechaza la lista entera si un producto es inválido', () => {
    expect(productosSchema.safeParse([expresoMediano, { id: 'x' }]).success).toBe(false)
  })
})

describe('errorSchema', () => {
  it('acepta { error: mensaje }', () => {
    expect(errorSchema.parse({ error: 'Producto no encontrado' })).toEqual({
      error: 'Producto no encontrado',
    })
  })

  it('rechaza un cuerpo sin error o con error que no es texto', () => {
    expect(errorSchema.safeParse({}).success).toBe(false)
    expect(errorSchema.safeParse({ error: 500 }).success).toBe(false)
  })
})

const pedidoPendiente = {
  id: 'pedido-1',
  estado: 'pendiente',
  mesaId: 'mesa-4',
  items: [
    { productoId: 'c5', cantidad: 2 },
    { productoId: 'p1', cantidad: 1 },
  ],
  total: 17220,
}

describe('pedidoSchema', () => {
  it('acepta un pedido con mesa, ítems y total', () => {
    expect(pedidoSchema.parse(pedidoPendiente)).toEqual(pedidoPendiente)
  })

  it('acepta un pedido para retirar en la barra (sin mesaId)', () => {
    const { id, estado, items, total } = pedidoPendiente
    const sinMesa = { id, estado, items, total }
    expect(pedidoSchema.parse(sinMesa)).toEqual(sinMesa)
  })

  it('rechaza un pedido sin total', () => {
    const { id, estado, items } = pedidoPendiente
    expect(pedidoSchema.safeParse({ id, estado, items }).success).toBe(false)
  })

  it('rechaza una cantidad que no es un entero positivo', () => {
    const cantidadCero = { ...pedidoPendiente, items: [{ productoId: 'c5', cantidad: 0 }] }
    const cantidadDecimal = { ...pedidoPendiente, items: [{ productoId: 'c5', cantidad: 1.5 }] }
    expect(pedidoSchema.safeParse(cantidadCero).success).toBe(false)
    expect(pedidoSchema.safeParse(cantidadDecimal).success).toBe(false)
  })
})

describe('crearPedidoRespuestaSchema', () => {
  it('acepta la respuesta del POST: { pedido, total }', () => {
    const { total, ...pedido } = pedidoPendiente
    const respuesta = { pedido, total }
    expect(crearPedidoRespuestaSchema.parse(respuesta)).toEqual(respuesta)
  })

  it('rechaza el formato plano del GET /pedidos/:id', () => {
    expect(crearPedidoRespuestaSchema.safeParse(pedidoPendiente).success).toBe(false)
  })
})
