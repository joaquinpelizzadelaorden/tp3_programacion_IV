import type { ZodType } from 'zod'
import { API_URL } from './config'
import {
  crearPedidoRespuestaSchema,
  errorSchema,
  pedidoSchema,
  productosSchema,
} from './schemas'
import type { CrearPedidoRespuesta, Pedido, Producto } from './schemas'

export type NuevoPedido = {
  id?: string
  mesaId?: string
  items: { productoId: string; cantidad: number }[]
}

export class ApiError extends Error {
  readonly status: number | null

  constructor(mensaje: string, status: number | null = null) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
  }
}

async function pedir<T>(ruta: string, esquema: ZodType<T>, init?: RequestInit): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, init)
  } catch {
    throw new ApiError('No se pudo conectar con el servidor')
  }

  let cuerpo: unknown
  try {
    cuerpo = await respuesta.json()
  } catch {
    cuerpo = undefined
  }

  if (!respuesta.ok) {
    const error = errorSchema.safeParse(cuerpo)
    const mensaje = error.success
      ? error.data.error
      : `El servidor respondió con el error ${respuesta.status}`
    throw new ApiError(mensaje, respuesta.status)
  }

  const resultado = esquema.safeParse(cuerpo)
  if (!resultado.success) {
    throw new ApiError('La respuesta del servidor no cumple el contrato esperado', respuesta.status)
  }
  return resultado.data
}

export function obtenerProductos(): Promise<Producto[]> {
  return pedir('/productos', productosSchema)
}

export function obtenerPedido(id: string): Promise<Pedido> {
  return pedir(`/pedidos/${encodeURIComponent(id)}`, pedidoSchema)
}

export function crearPedido(pedido: NuevoPedido): Promise<CrearPedidoRespuesta> {
  const pedidoConId = {
    ...pedido,
    id: pedido.id ?? `pedido-${crypto.randomUUID()}`,
  }

  return pedir('/pedidos', crearPedidoRespuestaSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedidoConId),
  })
}
