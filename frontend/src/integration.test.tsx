import { http, HttpResponse, delay } from 'msw'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { API_URL } from './api/config'
import { server } from './mocks/server'
import { CartProvider } from './cart/CartContext'
import App from './App'
import userEvent from '@testing-library/user-event'

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

  it('2. Pedido completo verificando el cuerpo enviado a POST /pedidos', async () => {
    // Simulamos que escaneó el QR de la mesa 4
    window.history.pushState({}, '', '/?mesa=4')
    
    let requestBody: any = null
    
    server.use(
      http.get(`${API_URL}/productos`, () => HttpResponse.json([
        { id: 'p1', tipo: 'pasteleria', nombre: 'Muffin de chocolate', precio: 2500 }
      ])),
      http.post(`${API_URL}/pedidos`, async ({ request }) => {
        // Guardamos el body que mandó el frontend
        requestBody = await request.json()
        return HttpResponse.json({ 
          pedido: { id: 'pedido-123', estado: 'pendiente', mesaId: 'mesa-4', items: requestBody.items }, 
          total: 2500 
        }, { status: 201 })
      })
    )

    const user = userEvent.setup()
    render(
      <CartProvider>
        <App />
      </CartProvider>
    )

    // Agregamos el producto y confirmamos
    await user.click(await screen.findByRole('button', { name: /agregar muffin/i }))
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    // Esperamos el mensaje de éxito de la API
    expect(await screen.findByText(/confirmado/i)).toBeInTheDocument()

    // Validamos el contrato enviado (FALLA ACÁ PORQUE FALTA MESA)
    expect(requestBody).toEqual({
      mesaId: 'mesa-4',
      items: [{ productoId: 'p1', cantidad: 1 }]
    })
  })

})