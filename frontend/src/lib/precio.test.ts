import { describe, expect, it } from 'vitest'
import { formatearPrecio } from './precio'

describe('formatearPrecio', () => {
  it('formatea con signo $ y punto de miles', () => {
    expect(formatearPrecio(7360)).toBe('$7.360')
    expect(formatearPrecio(17220)).toBe('$17.220')
  })

  it('no agrega punto a los números de hasta tres cifras', () => {
    expect(formatearPrecio(0)).toBe('$0')
    expect(formatearPrecio(999)).toBe('$999')
  })

  it('agrega un punto por cada grupo de tres cifras', () => {
    expect(formatearPrecio(1000)).toBe('$1.000')
    expect(formatearPrecio(1234567)).toBe('$1.234.567')
  })

  it('redondea los decimales al entero más cercano', () => {
    expect(formatearPrecio(7360.4)).toBe('$7.360')
    expect(formatearPrecio(7360.6)).toBe('$7.361')
  })
})
