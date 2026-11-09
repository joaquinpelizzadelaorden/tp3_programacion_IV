import { describe, expect, it } from 'vitest'
import type { Producto } from '../api/schemas'
import type { Cafe } from './cafe'
import { buscarCafe, obtenerDescripcionOrigen, obtenerOrigen, obtenerTamanio } from './cafe'

const descripcion = 'Acidez media, cuerpo equilibrado y notas cítricas y florales'

const productos: Producto[] = [
  {
    id: 'c4',
    tipo: 'expreso',
    nombre: 'Expreso Mediano Brasil',
    tamanio: 'Mediano',
    variedad: { nombre: 'Brasil', descripcion },
    precio: 5020,
  },
  {
    id: 'c5',
    tipo: 'expreso',
    nombre: 'Expreso Mediano Colombia',
    tamanio: 'Mediano',
    variedad: { nombre: 'Colombia', descripcion },
    precio: 7360,
  },
  {
    id: 'f5',
    tipo: 'filtrado',
    nombre: 'Filtrado Mediano Colombia',
    tamanio: 'Mediano',
    variedad: { nombre: 'Colombia', descripcion },
    precio: 5900,
  },
  { id: 'p1', tipo: 'pasteleria', nombre: 'Muffin de chocolate', precio: 2500 },
]

describe('buscarCafe', () => {
  it('encuentra el café que corresponde a bebida, tamaño y origen', () => {
    const cafe = buscarCafe(productos, { bebida: 'expreso', tamanio: 'Mediano', origen: 'Colombia' })

    expect(cafe?.id).toBe('c5')
  })

  it('distingue un expreso de un filtrado con el mismo tamaño y origen', () => {
    const cafe = buscarCafe(productos, { bebida: 'filtrado', tamanio: 'Mediano', origen: 'Colombia' })

    expect(cafe?.id).toBe('f5')
  })

  it('devuelve undefined si esa combinación no existe', () => {
    expect(
      buscarCafe(productos, { bebida: 'expreso', tamanio: 'Taza Grande', origen: 'Colombia' }),
    ).toBeUndefined()
    expect(
      buscarCafe(productos, { bebida: 'expreso', tamanio: 'Mediano', origen: 'Etiopía' }),
    ).toBeUndefined()
  })

  it('devuelve undefined mientras falte alguna de las tres elecciones', () => {
    expect(buscarCafe(productos, {})).toBeUndefined()
    expect(buscarCafe(productos, { tamanio: 'Mediano', origen: 'Colombia' })).toBeUndefined()
    expect(buscarCafe(productos, { bebida: 'expreso', origen: 'Colombia' })).toBeUndefined()
    expect(buscarCafe(productos, { bebida: 'expreso', tamanio: 'Mediano' })).toBeUndefined()
  })

  it('con bebida y tamaño elegidos permite consultar el precio de cada origen', () => {
    const precios = ['Brasil', 'Colombia', 'Etiopía'].map(
      (origen) => buscarCafe(productos, { bebida: 'expreso', tamanio: 'Mediano', origen })?.precio,
    )

    expect(precios).toEqual([5020, 7360, undefined])
  })
})

describe('datos del café desde el formato de la API', () => {
  const cafeApi: Cafe = {
    id: 'c1',
    tipo: 'expreso',
    nombre: 'Expreso Pocillo Brasil',
    precio: 5020,
  }

  it('obtiene tamaño, origen y descripción a partir del nombre del producto', () => {
    expect(obtenerTamanio(cafeApi)).toBe('Pocillo')
    expect(obtenerOrigen(cafeApi)).toBe('Brasil')
    expect(obtenerDescripcionOrigen(cafeApi)).toBe(
      'Acidez baja, cuerpo denso y notas de chocolate y frutos secos',
    )
  })
})
