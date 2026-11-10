import { http, HttpResponse, delay } from 'msw'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
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

    // Validamos el contrato enviado
    expect(requestBody).toEqual({
      mesaId: 'mesa-4',
      items: [{ productoId: 'p1', cantidad: 1 }]
    })
  })
  it('3. Error 4xx que conserva el carrito y muestra el mensaje', async () => {
    server.use(
      http.get(`${API_URL}/productos`, () => HttpResponse.json([
        { id: 'p1', tipo: 'pasteleria', nombre: 'Muffin de chocolate', precio: 2500 }
      ])),
      // Simulamos que la API rechaza el pedido con un status 400
      http.post(`${API_URL}/pedidos`, () => {
        return HttpResponse.json({ error: 'No hay stock suficiente' }, { status: 400 })
      })
    )

    const user = userEvent.setup()
    render(
      <CartProvider>
        <App />
      </CartProvider>
    )

    // Agregamos un producto y confirmamos
    await user.click(await screen.findByRole('button', { name: /agregar muffin/i }))
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    // Verificamos que se muestre el error devuelto por la API
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay stock suficiente')

    // Verificamos que el producto siga en el carrito (el subtotal sigue estando)
    expect(screen.getByText('Subtotal orientativo: $2.500')).toBeInTheDocument()
  })
  it('4. API caída (Network Error): muestra mensaje de error de conexión', async () => {
    server.use(
      // HttpResponse.error() simula una caída total de red (sin respuesta HTTP)
      http.get(`${API_URL}/productos`, () => HttpResponse.error())
    )

    render(
      <CartProvider>
        <App />
      </CartProvider>
    )

    // Verificamos que se muestre el alerta con el mensaje de error de red
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor')
  })
  it('5. Respuesta que no cumple el contrato (Zod): muestra error si el backend responde mal', async () => {
    server.use(
      // Devolvemos un producto que no cumple con el esquema (le falta el precio requerido)
      http.get(`${API_URL}/productos`, () => HttpResponse.json([
        { id: 'p1', tipo: 'pasteleria', nombre: 'Muffin sin precio' }
      ]))
    )

    render(
      <CartProvider>
        <App />
      </CartProvider>
    )

    // Verificamos que se muestre el alerta informando que la respuesta no cumple el contrato
    expect(await screen.findByRole('alert')).toHaveTextContent(/la respuesta del servidor no cumple el contrato esperado/i)
  })
  it('6. Error 500 con reintento: muestra error al fallar y recupera al reintentar', async () => {
    let intentos = 0
    server.use(
      http.get(`${API_URL}/productos`, () => {
        intentos += 1
        if (intentos === 1) {
          return HttpResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
        }
        return HttpResponse.json([
          { id: 'p1', tipo: 'pasteleria', nombre: 'Muffin de chocolate', precio: 2500 }
        ])
      })
    )

    const user = userEvent.setup()
    render(
      <CartProvider>
        <App />
      </CartProvider>
    )

    
    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor')
    
    const botonReintentar = screen.getByRole('button', { name: /reintentar/i })
    await user.click(botonReintentar)

    expect(await screen.findByText('Muffin de chocolate')).toBeInTheDocument()
  })
})