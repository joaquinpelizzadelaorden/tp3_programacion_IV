import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_URL } from '../api/config'
import type { Producto } from '../api/schemas'
import { CartProvider, useCart } from '../cart/CartContext'
import { server } from '../mocks/server'
import { ConfirmarPedido } from './ConfirmarPedido'

const expreso: Producto = {
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

// Controles de apoyo: llenan el carrito igual que el usuario, con dispatch
function AgregarExpreso() {
  const { dispatch } = useCart()
  return (
    <button onClick={() => dispatch({ type: 'agregar', producto: expreso })}>
      Agregar expreso
    </button>
  )
}

function LineasEnCarrito() {
  const { carrito } = useCart()
  return <p>Líneas en el carrito: {carrito.length}</p>
}

async function renderizarConDosExpresos(mesaId?: string) {
  const user = userEvent.setup()
  render(
    <CartProvider>
      <AgregarExpreso />
      <LineasEnCarrito />
      <ConfirmarPedido mesaId={mesaId} />
    </CartProvider>,
  )
  await user.click(screen.getByRole('button', { name: 'Agregar expreso' }))
  await user.click(screen.getByRole('button', { name: 'Agregar expreso' }))
  return user
}

const respuestaApi = {
  pedido: {
    id: 'pedido-7',
    estado: 'pendiente',
    mesaId: 'mesa-4',
    items: [{ productoId: 'c5', cantidad: 2 }],
  },
  total: 17220,
}

describe('ConfirmarPedido', () => {
  it('con el carrito vacío no se puede confirmar', () => {
    render(
      <CartProvider>
        <ConfirmarPedido />
      </CartProvider>,
    )

    expect(screen.getByRole('button', { name: /confirmar pedido/i })).toBeDisabled()
  })

  it('envía la mesa y los ítems del carrito a POST /pedidos', async () => {
    let cuerpo: unknown
    server.use(
      http.post(`${API_URL}/pedidos`, async ({ request }) => {
        cuerpo = await request.json()
        return HttpResponse.json(respuestaApi, { status: 201 })
      }),
    )
    const user = await renderizarConDosExpresos('mesa-4')

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))
    await screen.findByText(/pedido-7/)

    expect(cuerpo).toEqual({ mesaId: 'mesa-4', items: [{ productoId: 'c5', cantidad: 2 }] })
  })

  it('sin mesa (retiro en barra) no envía mesaId', async () => {
    let cuerpo: unknown
    server.use(
      http.post(`${API_URL}/pedidos`, async ({ request }) => {
        cuerpo = await request.json()
        return HttpResponse.json(respuestaApi, { status: 201 })
      }),
    )
    const user = await renderizarConDosExpresos()

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))
    await screen.findByText(/pedido-7/)

    expect(cuerpo).toEqual({ items: [{ productoId: 'c5', cantidad: 2 }] })
  })

  it('muestra número, estado y el total que devolvió la API, no el del carrito', async () => {
    server.use(http.post(`${API_URL}/pedidos`, () => HttpResponse.json(respuestaApi, { status: 201 })))
    const user = await renderizarConDosExpresos('mesa-4')

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(await screen.findByText(/pedido-7/)).toBeInTheDocument()
    expect(screen.getByText(/pendiente/i)).toBeInTheDocument()
    expect(screen.getByText(/17\.220/)).toBeInTheDocument()
    expect(screen.queryByText(/14\.720/)).not.toBeInTheDocument()
  })

  it('deshabilita el botón mientras se envía', async () => {
    server.use(
      http.post(`${API_URL}/pedidos`, async () => {
        await new Promise((resolver) => setTimeout(resolver, 50))
        return HttpResponse.json(respuestaApi, { status: 201 })
      }),
    )
    const user = await renderizarConDosExpresos('mesa-4')

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(screen.getByRole('button', { name: /confirmar pedido/i })).toBeDisabled()
    await screen.findByText(/pedido-7/)
  })

  it('vacía el carrito solo después de que el pedido se confirmó', async () => {
    server.use(http.post(`${API_URL}/pedidos`, () => HttpResponse.json(respuestaApi, { status: 201 })))
    const user = await renderizarConDosExpresos('mesa-4')
    expect(screen.getByText('Líneas en el carrito: 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))
    await screen.findByText(/pedido-7/)

    expect(screen.getByText('Líneas en el carrito: 0')).toBeInTheDocument()
  })
    it('si la API rechaza el pedido, muestra su mensaje tal cual', async () => {
    server.use(
      http.post(`${API_URL}/pedidos`, () =>
        HttpResponse.json({ error: 'mesaId debe tener el formato mesa-<número>' }, { status: 400 }),
      ),
    )
    const user = await renderizarConDosExpresos('mesa-xyz')

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'mesaId debe tener el formato mesa-<número>',
    )
  })

  it('si la API rechaza el pedido, el carrito no se pierde', async () => {
    server.use(
      http.post(`${API_URL}/pedidos`, () =>
        HttpResponse.json({ error: 'El producto no existe: c5' }, { status: 404 }),
      ),
    )
    const user = await renderizarConDosExpresos('mesa-4')

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))
    await screen.findByRole('alert')

    expect(screen.getByText('Líneas en el carrito: 1')).toBeInTheDocument()
    expect(screen.queryByText(/pedido confirmado/i)).not.toBeInTheDocument()
  })

  it('tras un error se puede reintentar y el pedido se confirma', async () => {
    let intentos = 0
    server.use(
      http.post(`${API_URL}/pedidos`, () => {
        intentos += 1
        return intentos === 1
          ? HttpResponse.json({ error: 'Intentá de nuevo en un momento' }, { status: 400 })
          : HttpResponse.json(respuestaApi, { status: 201 })
      }),
    )
    const user = await renderizarConDosExpresos('mesa-4')

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar pedido/i })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(await screen.findByText(/pedido-7/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})