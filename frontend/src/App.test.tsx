import { delay, http, HttpResponse } from 'msw'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { API_URL } from './api/config'
import { server } from './mocks/server'
import App from './App'

const muffin = {
  id: 'p1',
  tipo: 'pasteleria',
  nombre: 'Muffin de chocolate',
  precio: 2500,
}

describe('App', () => {
  it('muestra un indicador mientras carga el menú y luego los productos', async () => {
    server.use(
      http.get(`${API_URL}/productos`, async () => {
        await delay(100)
        return HttpResponse.json([muffin])
      }),
    )
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando menú')
    expect(await screen.findByText('Muffin de chocolate')).toBeInTheDocument()
    expect(screen.getByLabelText('Productos del menú')).toBeInTheDocument()
  })

  it('muestra el error y permite reintentar la carga', async () => {
    let intentos = 0
    server.use(
      http.get(`${API_URL}/productos`, () => {
        intentos += 1
        return intentos === 1
          ? HttpResponse.json({ error: 'Servidor no disponible' }, { status: 503 })
          : HttpResponse.json([muffin])
      }),
    )
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor no disponible')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Muffin de chocolate')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
