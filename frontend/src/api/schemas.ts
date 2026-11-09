import { z } from 'zod'

const variedadSchema = z.object({
  nombre: z.string(),
  descripcion: z.string(),
})

const cafeSchema = z.object({
  id: z.string(),
  tipo: z.enum(['expreso', 'filtrado']),
  nombre: z.string(),
  tamanio: z.string().optional(),
  variedad: variedadSchema.optional(),
  precio: z.number(),
})

const pasteleriaSchema = z.object({
  id: z.string(),
  tipo: z.literal('pasteleria'),
  nombre: z.string(),
  precio: z.number(),
})

export const productoSchema = z.union([cafeSchema, pasteleriaSchema])
export const productosSchema = z.array(productoSchema)
export const errorSchema = z.object({ error: z.string() })

const itemPedidoSchema = z.object({
  productoId: z.string(),
  cantidad: z.number().int().positive(),
})

const pedidoBaseSchema = z.object({
  id: z.string(),
  estado: z.string(),
  mesaId: z.string().optional(),
  items: z.array(itemPedidoSchema),
})

export const pedidoSchema = pedidoBaseSchema.extend({ total: z.number() })
export const crearPedidoRespuestaSchema = z.object({
  pedido: pedidoBaseSchema,
  total: z.number(),
})

export type Producto = z.infer<typeof productoSchema>
export type ErrorApi = z.infer<typeof errorSchema>
export type Pedido = z.infer<typeof pedidoSchema>
export type CrearPedidoRespuesta = z.infer<typeof crearPedidoRespuestaSchema>
