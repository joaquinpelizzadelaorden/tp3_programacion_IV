import { describe, expect, it } from 'vitest'
import { leerMesa } from './mesa'

describe('leerMesa', () => {
  it('lee el número de mesa de ?mesa=N', () => {
    expect(leerMesa('?mesa=4')).toBe(4)
  })

  it('acepta el parámetro sin el signo ? inicial', () => {
    expect(leerMesa('mesa=7')).toBe(7)
  })

  it('encuentra la mesa entre otros parámetros', () => {
    expect(leerMesa('?origen=qr&mesa=12&idioma=es')).toBe(12)
  })

  it('acepta ceros a la izquierda', () => {
    expect(leerMesa('?mesa=04')).toBe(4)
  })

  it('devuelve null si no hay ?mesa (retiro en la barra)', () => {
    expect(leerMesa('')).toBeNull()
    expect(leerMesa('?otro=1')).toBeNull()
  })

  it('devuelve null si el valor no es un entero positivo', () => {
    for (const invalido of ['', 'abc', '0', '-3', '2.5', '4abc', '%204', '99999999999999999999']) {
      expect(leerMesa(`?mesa=${invalido}`), `mesa=${invalido}`).toBeNull()
    }
  })
})
