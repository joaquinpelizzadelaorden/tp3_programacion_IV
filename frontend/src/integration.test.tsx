import { http, HttpResponse, delay } from 'msw'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { API_URL } from './api/config'
import { server } from './mocks/server'
import { CartProvider } from './cart/CartContext'
import App from './App'

describe('Fase 7: Tests de Integración', () => {
  it('1. Carga del menú: muestra indicador de carga y luego los productos', async () => {
    server.use(
      http.get(`${API_URL}/productos`, async () => {
        await delay(100) // Demoramos la respuesta para poder capturar el "cargando..."
        return HttpResponse.json([
          { id: 'p1', tipo: 'pasteleria', nombre: 'Muffin de chocolate', precio: 2500 }
        ])
      })
    )

    render(
      <CartProvider>
        <App />
      </CartProvider>
    )

    // Verificamos el indicador de carga
    expect(screen.getByRole('status')).toHaveTextContent(/cargando menú/i)

    // Verificamos que el producto aparece en pantalla tras resolverse el fetch
    expect(await screen.findByText('Muffin de chocolate')).toBeInTheDocument()
  })
})