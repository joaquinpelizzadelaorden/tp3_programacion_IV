import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../mocks/server'
import { ApiError, crearPedido, obtenerPedido, obtenerProductos } from './client'
import { API_URL } from './config'

const muffin = {
  id: 'p1',
  tipo: 'pasteleria',
  nombre: 'Muffin de chocolate',
  precio: 2500,
}

const pedido = {
  id: 'pedido-1',
  estado: 'pendiente',
  mesaId: 'mesa-4',
  items: [{ productoId: 'p1', cantidad: 1 }],
}

describe('obtenerProductos', () => {
  it('devuelve los productos de GET /productos', async () => {
    server.use(http.get(`${API_URL}/productos`, () => HttpResponse.json([muffin])))

    expect(await obtenerProductos()).toEqual([muffin])
  })

  it('lanza ApiError con el mensaje que devolvió la API', async () => {
    server.use(
      http.get(`${API_URL}/productos`, () =>
        HttpResponse.json({ error: 'Error interno' }, { status: 500 }),
      ),
    )

    const promesa = obtenerProductos()
    await expect(promesa).rejects.toBeInstanceOf(ApiError)
    await expect(promesa).rejects.toMatchObject({ message: 'Error interno', status: 500 })
  })

  it('usa un mensaje genérico si el error no tiene el formato { error }', async () => {
    server.use(
      http.get(`${API_URL}/productos`, () => HttpResponse.text('Bad gateway', { status: 502 })),
    )

    await expect(obtenerProductos()).rejects.toMatchObject({
      message: 'El servidor respondió con el error 502',
      status: 502,
    })
  })

  it('lanza ApiError si la respuesta no cumple el contrato', async () => {
    server.use(
      http.get(`${API_URL}/productos`, () =>
        HttpResponse.json([{ id: 'p1', tipo: 'pasteleria', nombre: 'Muffin de chocolate' }]),
      ),
    )

    await expect(obtenerProductos()).rejects.toMatchObject({
      message: 'La respuesta del servidor no cumple el contrato esperado',
    })
  })

  it('lanza ApiError si la API está caída', async () => {
    server.use(http.get(`${API_URL}/productos`, () => HttpResponse.error()))

    await expect(obtenerProductos()).rejects.toMatchObject({
      message: 'No se pudo conectar con el servidor',
      status: null,
    })
  })
})

describe('obtenerPedido', () => {
  it('pide GET /pedidos/:id y devuelve el pedido con su total', async () => {
    server.use(
      http.get(`${API_URL}/pedidos/:id`, ({ params }) =>
        HttpResponse.json({ ...pedido, id: params.id, total: 2500 }),
      ),
    )

    expect(await obtenerPedido('pedido-9')).toEqual({ ...pedido, id: 'pedido-9', total: 2500 })
  })

  it('lanza ApiError con el mensaje de la API si el pedido no existe', async () => {
    server.use(
      http.get(`${API_URL}/pedidos/:id`, () =>
        HttpResponse.json({ error: 'Pedido no encontrado' }, { status: 404 }),
      ),
    )

    await expect(obtenerPedido('nope')).rejects.toMatchObject({
      message: 'Pedido no encontrado',
      status: 404,
    })
  })
})

describe('crearPedido', () => {
  it('envía POST /pedidos con el cuerpo en JSON y devuelve { pedido, total }', async () => {
    let cuerpo: unknown
    let tipoContenido: string | null = null
    server.use(
      http.post(`${API_URL}/pedidos`, async ({ request }) => {
        cuerpo = await request.json()
        tipoContenido = request.headers.get('content-type')
        return HttpResponse.json({ pedido, total: 2500 }, { status: 201 })
      }),
    )
    const nuevo = { mesaId: 'mesa-4', items: [{ productoId: 'p1', cantidad: 1 }] }

    const respuesta = await crearPedido(nuevo)

    expect(cuerpo).toEqual(nuevo)
    expect(tipoContenido).toBe('application/json')
    expect(respuesta).toEqual({ pedido, total: 2500 })
  })

  it('lanza ApiError con el mensaje que devolvió la API al rechazar el pedido', async () => {
    server.use(
      http.post(`${API_URL}/pedidos`, () =>
        HttpResponse.json({ error: 'El producto no existe: x9' }, { status: 400 }),
      ),
    )

    await expect(
      crearPedido({ items: [{ productoId: 'x9', cantidad: 1 }] }),
    ).rejects.toMatchObject({ message: 'El producto no existe: x9', status: 400 })
  })
})
