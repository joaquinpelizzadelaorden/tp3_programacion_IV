import { describe, expect, it } from 'vitest'
import { API_URL } from '../api/config'
import { crearPedidoRespuestaSchema, pedidoSchema, productosSchema } from '../api/schemas'
import { resetearPedidos } from './handlers'

const postPedido = (cuerpo: unknown) =>
  fetch(`${API_URL}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })

const pedidoDeLaMesa4 = {
  mesaId: 'mesa-4',
  items: [
    { productoId: 'c5', cantidad: 2 },
    { productoId: 'p1', cantidad: 1 },
  ],
}

describe('GET /productos', () => {
  it('devuelve 20 productos que cumplen el contrato', async () => {
    const respuesta = await fetch(`${API_URL}/productos`)

    expect(respuesta.status).toBe(200)
    expect(productosSchema.parse(await respuesta.json())).toHaveLength(20)
  })

  it('trae los mismos precios que la API real', async () => {
    const productos = productosSchema.parse(await (await fetch(`${API_URL}/productos`)).json())
    const precioDe = (id: string) => productos.find((producto) => producto.id === id)?.precio

    expect(precioDe('c5')).toBe(7360)
    expect(precioDe('f5')).toBe(5900)
    expect(precioDe('p1')).toBe(2500)
    expect(precioDe('p2')).toBe(4200)
  })
})

describe('GET /productos/:id', () => {
  it('devuelve el producto pedido', async () => {
    const respuesta = await fetch(`${API_URL}/productos/c5`)

    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toMatchObject({ id: 'c5', nombre: 'Expreso Mediano Colombia' })
  })

  it('responde 404 con { error } si no existe', async () => {
    const respuesta = await fetch(`${API_URL}/productos/zzz`)

    expect(respuesta.status).toBe(404)
    expect(await respuesta.json()).toEqual({ error: 'Producto no encontrado' })
  })
})

describe('POST /pedidos', () => {
  it('responde 201 con el pedido pendiente, la mesa y el total', async () => {
    const respuesta = await postPedido(pedidoDeLaMesa4)

    expect(respuesta.status).toBe(201)
    const { pedido, total } = crearPedidoRespuestaSchema.parse(await respuesta.json())
    expect(pedido).toMatchObject({ estado: 'pendiente', mesaId: 'mesa-4', items: pedidoDeLaMesa4.items })
    expect(total).toBe(17220)
  })

  it('acepta un pedido para retirar en la barra (sin mesaId)', async () => {
    const respuesta = await postPedido({ items: [{ productoId: 'p2', cantidad: 1 }] })

    expect(respuesta.status).toBe(201)
    const { pedido, total } = crearPedidoRespuestaSchema.parse(await respuesta.json())
    expect(pedido.mesaId).toBeUndefined()
    expect(total).toBe(4200)
  })

  it('usa el id que viene en el cuerpo o genera uno distinto por pedido', async () => {
    const conId = crearPedidoRespuestaSchema.parse(
      await (await postPedido({ ...pedidoDeLaMesa4, id: 'mi-pedido' })).json(),
    )
    const primero = crearPedidoRespuestaSchema.parse(await (await postPedido(pedidoDeLaMesa4)).json())
    const segundo = crearPedidoRespuestaSchema.parse(await (await postPedido(pedidoDeLaMesa4)).json())

    expect(conId.pedido.id).toBe('mi-pedido')
    expect(primero.pedido.id).not.toBe(segundo.pedido.id)
  })

  it('responde 400 con { error } si no hay ítems', async () => {
    const respuesta = await postPedido({ mesaId: 'mesa-4', items: [] })

    expect(respuesta.status).toBe(400)
    expect(await respuesta.json()).toEqual({
      error: 'Faltan datos obligatorios o el formato de items es incorrecto',
    })
  })

  it('responde 400 si un producto no existe', async () => {
    const respuesta = await postPedido({ items: [{ productoId: 'x9', cantidad: 1 }] })

    expect(respuesta.status).toBe(400)
    expect(await respuesta.json()).toEqual({ error: 'El producto no existe: x9' })
  })

  it('responde 400 si la cantidad no es un entero positivo', async () => {
    const respuesta = await postPedido({ items: [{ productoId: 'c5', cantidad: 0 }] })

    expect(respuesta.status).toBe(400)
    expect(await respuesta.json()).toEqual({ error: 'La cantidad debe ser un entero positivo' })
  })

  it('responde 400 si el mesaId no tiene el formato mesa-<número>', async () => {
    const respuesta = await postPedido({ mesaId: '4', items: [{ productoId: 'c5', cantidad: 1 }] })

    expect(respuesta.status).toBe(400)
    expect(await respuesta.json()).toEqual({ error: 'mesaId debe tener el formato mesa-<número>' })
  })
})

describe('GET /pedidos/:id', () => {
  it('devuelve el pedido creado con su estado, ítems y total', async () => {
    await postPedido({ ...pedidoDeLaMesa4, id: 'p-100' })

    const respuesta = await fetch(`${API_URL}/pedidos/p-100`)

    expect(respuesta.status).toBe(200)
    expect(pedidoSchema.parse(await respuesta.json())).toMatchObject({
      id: 'p-100',
      estado: 'pendiente',
      total: 17220,
    })
  })

  it('responde 404 con { error } si el pedido no existe', async () => {
    const respuesta = await fetch(`${API_URL}/pedidos/nope`)

    expect(respuesta.status).toBe(404)
    expect(await respuesta.json()).toEqual({ error: 'Pedido no encontrado' })
  })
})

describe('resetearPedidos', () => {
  it('borra los pedidos creados', async () => {
    await postPedido({ ...pedidoDeLaMesa4, id: 'p-200' })

    resetearPedidos()

    expect((await fetch(`${API_URL}/pedidos/p-200`)).status).toBe(404)
  })
})
