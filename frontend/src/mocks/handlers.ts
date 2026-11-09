import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { API_URL } from '../api/config'
import type { Pedido } from '../api/schemas'
import { productosMock } from './fixtures'

type PedidoGuardado = Omit<Pedido, 'total'>

const nuevoPedidoSchema = z.object({
  id: z.string().optional(),
  mesaId: z.string().optional(),
  items: z.array(z.object({ productoId: z.string(), cantidad: z.number() })).min(1),
})

const pedidos = new Map<string, PedidoGuardado>()
let contador = 0

export function resetearPedidos(): void {
  pedidos.clear()
  contador = 0
}

const responderError = (mensaje: string, status: number) =>
  HttpResponse.json({ error: mensaje }, { status })

const totalDe = (pedido: PedidoGuardado): number =>
  pedido.items.reduce((suma, item) => {
    const producto = productosMock.find((candidato) => candidato.id === item.productoId)
    return suma + (producto ? producto.precio * item.cantidad : 0)
  }, 0)

export const handlers = [
  http.get(`${API_URL}/productos`, () => HttpResponse.json(productosMock)),

  http.get(`${API_URL}/productos/:id`, ({ params }) => {
    const producto = productosMock.find((candidato) => candidato.id === params.id)
    return producto ? HttpResponse.json(producto) : responderError('Producto no encontrado', 404)
  }),

  http.post(`${API_URL}/pedidos`, async ({ request }) => {
    const cuerpo = nuevoPedidoSchema.safeParse(await request.json().catch(() => undefined))
    if (!cuerpo.success) {
      return responderError('Faltan datos obligatorios o el formato de items es incorrecto', 400)
    }
    const { id, mesaId, items } = cuerpo.data

    if (mesaId !== undefined && !/^mesa-\d+$/.test(mesaId)) {
      return responderError('mesaId debe tener el formato mesa-<número>', 400)
    }
    for (const item of items) {
      if (!productosMock.some((producto) => producto.id === item.productoId)) {
        return responderError(`El producto no existe: ${item.productoId}`, 400)
      }
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        return responderError('La cantidad debe ser un entero positivo', 400)
      }
    }

    contador += 1
    const pedido: PedidoGuardado = {
      id: id ?? `pedido-${contador}`,
      estado: 'pendiente',
      items,
      ...(mesaId !== undefined && { mesaId }),
    }
    pedidos.set(pedido.id, pedido)
    return HttpResponse.json({ pedido, total: totalDe(pedido) }, { status: 201 })
  }),

  http.get(`${API_URL}/pedidos/:id`, ({ params }) => {
    const pedido = pedidos.get(String(params.id))
    return pedido
      ? HttpResponse.json({ ...pedido, total: totalDe(pedido) })
      : responderError('Pedido no encontrado', 404)
  }),
]
