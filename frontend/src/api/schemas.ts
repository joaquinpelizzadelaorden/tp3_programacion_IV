import { z } from 'zod'

const variedadSchema = z.object({
  nombre: z.string(),
  descripcion: z.string(),
})

const cafeSchema = z.object({
  id: z.string(),
  tipo: z.enum(['expreso', 'filtrado']),
  nombre: z.string(),
  tamanio: z.string(),
  variedad: variedadSchema,
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

export type Producto = z.infer<typeof productoSchema>
export type ErrorApi = z.infer<typeof errorSchema>
