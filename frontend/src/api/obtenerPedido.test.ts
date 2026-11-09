// Test para obtener el pedido creado.

import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../mocks/server'
import { API_URL } from './config'
import { obtenerPedido } from './client'

const items = [{ productoId: 'cafe-1', cantidad: 2 }]

// Funcionamiento general.
describe('obtenerPedido', () => {
  it('consulta GET /pedidos/:id y devuelve el estado y el total de la API', async () => {
    server.use(
      http.get(`${API_URL}/pedidos/pedido-1`, () =>
        HttpResponse.json({ id: 'pedido-1', estado: 'en preparación', items, total: 14720 }),
      ),
    )

    const pedido = await obtenerPedido('pedido-1')

    expect(pedido.id).toBe('pedido-1')
    expect(pedido.estado).toBe('en preparación')
    expect(pedido.total).toBe(14720)
  })

  it('refleja el cambio de estado entre dos consultas', async () => {
    const estados = ['pendiente', 'listo']
    server.use(
      http.get(`${API_URL}/pedidos/pedido-1`, () =>
        HttpResponse.json({ id: 'pedido-1', estado: estados.shift(), items, total: 14720 }),
      ),
    )

    expect((await obtenerPedido('pedido-1')).estado).toBe('pendiente')
    expect((await obtenerPedido('pedido-1')).estado).toBe('listo')
  })

  it('lanza el mensaje de la API si el pedido no existe', async () => {
    server.use(
      http.get(`${API_URL}/pedidos/pedido-99`, () =>
        HttpResponse.json({ error: 'Pedido no encontrado' }, { status: 404 }),
      ),
    )

    await expect(obtenerPedido('pedido-99')).rejects.toThrow('Pedido no encontrado')
  })

  it('rechaza una respuesta que no cumple el contrato', async () => {
    server.use(
      http.get(`${API_URL}/pedidos/pedido-1`, () => HttpResponse.json({ cualquier: 'cosa' })),
    )

    await expect(obtenerPedido('pedido-1')).rejects.toThrow()
  })
})