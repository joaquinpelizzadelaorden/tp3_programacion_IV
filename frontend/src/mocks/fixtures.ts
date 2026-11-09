import type { Producto } from '../api/schemas'

const ORIGENES = [
  {
    nombre: 'Brasil',
    precioPorGramo: 140,
    descripcion: 'Acidez baja, cuerpo denso y notas de chocolate y frutos secos',
  },
  {
    nombre: 'Colombia',
    precioPorGramo: 180,
    descripcion: 'Acidez media, cuerpo equilibrado y notas cítricas y florales',
  },
  {
    nombre: 'Etiopía',
    precioPorGramo: 240,
    descripcion: 'Acidez alta, cuerpo ligero y notas frutales y florales',
  },
]

const TAMANIOS = ['Pocillo', 'Mediano', 'Taza Grande']
const GRAMOS = { expreso: [18, 27, 36], filtrado: [6, 15, 25] }
const PRECIO_BASE = { expreso: 2500, filtrado: 3200 }
const PREFIJO = { expreso: 'c', filtrado: 'f' }
const ETIQUETA = { expreso: 'Expreso', filtrado: 'Filtrado' }

function crearCafes(tipo: 'expreso' | 'filtrado'): Producto[] {
  return TAMANIOS.flatMap((tamanio, t) =>
    ORIGENES.map((origen, o) => ({
      id: `${PREFIJO[tipo]}${t * ORIGENES.length + o + 1}`,
      tipo,
      nombre: `${ETIQUETA[tipo]} ${tamanio} ${origen.nombre}`,
      tamanio,
      variedad: { nombre: origen.nombre, descripcion: origen.descripcion },
      precio: PRECIO_BASE[tipo] + GRAMOS[tipo][t] * origen.precioPorGramo,
    })),
  )
}

export const productosMock: Producto[] = [
  ...crearCafes('expreso'),
  ...crearCafes('filtrado'),
  { id: 'p1', tipo: 'pasteleria', nombre: 'Muffin de chocolate', precio: 2500 },
  { id: 'p2', tipo: 'pasteleria', nombre: 'Torta selva negra', precio: 4200 },
]
