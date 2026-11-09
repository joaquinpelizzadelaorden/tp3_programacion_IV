import { describe, expect, it } from 'vitest'
import { errorSchema, productoSchema, productosSchema } from './schemas'

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
