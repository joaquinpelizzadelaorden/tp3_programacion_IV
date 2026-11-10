// Archivo de test para la función de crearPedido

import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../mocks/server'
import { API_URL } from './config'
import { crearPedido } from './client'

const items = [
  { productoId: 'cafe-1', cantidad: 2 },
  { productoId: 'muffin-1', cantidad: 1 },
]

const respuestaPedido = {
  pedido: { id: 'pedido-1', estado: 'pendiente', mesaId: 'mesa-4', items },
  total: 17220,
}

describe('crearPedido', () => {
  it('envía mesaId e ítems y devuelve el pedido de la API', async () => {
    let cuerpo: unknown
    server.use(
      http.post(`${API_URL}/pedidos`, async ({ request }) => {
        cuerpo = await request.json()
        return HttpResponse.json(respuestaPedido, { status: 201 })
      }),
    )

    const resultado = await crearPedido({ mesaId: 'mesa-4', items })

    expect(cuerpo).toMatchObject({
      id: expect.stringMatching(/^pedido-/),
      mesaId: 'mesa-4',
      items,
    })
    expect(resultado.total).toBe(17220)
    expect(resultado.pedido.estado).toBe('pendiente')
  })

  it('sin mesa no envía mesaId (retiro en barra)', async () => {
    let cuerpo: unknown
    server.use(
      http.post(`${API_URL}/pedidos`, async ({ request }) => {
        cuerpo = await request.json()
        return HttpResponse.json(
          { pedido: { id: 'pedido-2', estado: 'pendiente', items }, total: 17220 },
          { status: 201 },
        )
      }),
    )

    await crearPedido({ items })

    expect(cuerpo).toMatchObject({ id: expect.stringMatching(/^pedido-/), items })
  })

  it('lanza el mensaje que devuelve la API cuando rechaza el pedido', async () => {
    server.use(
      http.post(`${API_URL}/pedidos`, () =>
        HttpResponse.json({ error: 'La mesa 99 no existe' }, { status: 404 }),
      ),
    )

    await expect(crearPedido({ mesaId: 'mesa-99', items })).rejects.toThrow(
      'La mesa 99 no existe',
    )
  })
})
