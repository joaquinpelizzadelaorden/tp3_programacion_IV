import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_URL } from '../api/config'
import { server } from '../mocks/server'
import { SeguimientoPedido } from './SeguimientoPedido'

const items = [{ productoId: 'c5', cantidad: 2 }]

describe('SeguimientoPedido', () => {
  it('muestra el estado inicial del pedido', () => {
    render(<SeguimientoPedido pedidoId="pedido-7" estadoInicial="pendiente" />)

    expect(screen.getByText(/pendiente/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /actualizar estado/i })).toBeEnabled()
  })

  it('al actualizar consulta GET /pedidos/:id y muestra el nuevo estado sin recargar', async () => {
    server.use(
      http.get(`${API_URL}/pedidos/pedido-7`, () =>
        HttpResponse.json({ id: 'pedido-7', estado: 'listo', items, total: 14720 }),
      ),
    )
    const user = userEvent.setup()
    render(<SeguimientoPedido pedidoId="pedido-7" estadoInicial="pendiente" />)

    await user.click(screen.getByRole('button', { name: /actualizar estado/i }))

    expect(await screen.findByText(/listo/i)).toBeInTheDocument()
    expect(screen.queryByText(/pendiente/i)).not.toBeInTheDocument()
  })

  it('deshabilita el botón mientras consulta', async () => {
    server.use(
      http.get(`${API_URL}/pedidos/pedido-7`, async () => {
        await new Promise((resolver) => setTimeout(resolver, 50))
        return HttpResponse.json({ id: 'pedido-7', estado: 'listo', items, total: 14720 })
      }),
    )
    const user = userEvent.setup()
    render(<SeguimientoPedido pedidoId="pedido-7" estadoInicial="pendiente" />)

    await user.click(screen.getByRole('button', { name: /actualizar estado/i }))

    expect(screen.getByRole('button', { name: /actualizar estado/i })).toBeDisabled()
    await screen.findByText(/listo/i)
  })

  it('si la consulta falla muestra el mensaje de la API y conserva el último estado', async () => {
    server.use(
      http.get(`${API_URL}/pedidos/pedido-7`, () =>
        HttpResponse.json({ error: 'Pedido no encontrado' }, { status: 404 }),
      ),
    )
    const user = userEvent.setup()
    render(<SeguimientoPedido pedidoId="pedido-7" estadoInicial="pendiente" />)

    await user.click(screen.getByRole('button', { name: /actualizar estado/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Pedido no encontrado')
    expect(screen.getByText(/pendiente/i)).toBeInTheDocument()
  })
})