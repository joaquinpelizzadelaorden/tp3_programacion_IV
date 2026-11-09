import { delay, http, HttpResponse } from 'msw'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { API_URL } from './api/config'
import { server } from './mocks/server'
import { CartProvider } from './cart/CartContext'
import App from './App'

const muffin = {
  id: 'p1',
  tipo: 'pasteleria',
  nombre: 'Muffin de chocolate',
  precio: 2500,
}

function renderApp() {
  return render(
    <CartProvider>
      <App />
    </CartProvider>,
  )
}

describe('App', () => {
  it('muestra un indicador mientras carga el menú y luego los productos', async () => {
    server.use(
      http.get(`${API_URL}/productos`, async () => {
        await delay(100)
        return HttpResponse.json([muffin])
      }),
    )
    renderApp()

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
    renderApp()

    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor no disponible')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Muffin de chocolate')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('permite elegir bebida, tamaño y origen antes de agregar un café al carrito', async () => {
    server.use(
      http.get(`${API_URL}/productos`, () =>
        HttpResponse.json([
          {
            id: 'c1',
            tipo: 'expreso',
            nombre: 'Expreso Pocillo Brasil',
            precioBase: 2500,
            precio: 5020,
            gramos: 18,
            precioPorGramo: 140,
          },
          {
            id: 'c2',
            tipo: 'expreso',
            nombre: 'Expreso Pocillo Colombia',
            precioBase: 2500,
            precio: 5740,
            gramos: 18,
            precioPorGramo: 180,
          },
          {
            id: 'f1',
            tipo: 'filtrado',
            nombre: 'Filtrado Pocillo Brasil',
            precioBase: 3200,
            precio: 4040,
            gramos: 6,
            precioPorGramo: 140,
          },
        ]),
      ),
    )
    const user = userEvent.setup()
    renderApp()

    const addButton = await screen.findByRole('button', { name: 'Agregar al carrito' })
    expect(addButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Expreso' }))
    expect(addButton).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Pocillo' }))
    expect(addButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /Colombia.*\$5\.740/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Colombia.*\$5\.740/ }))
    expect(screen.getByText('Acidez media, cuerpo equilibrado y notas cítricas y florales'))
      .toBeInTheDocument()
    expect(addButton).toBeEnabled()
    await user.click(addButton)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Expreso Pocillo Colombia se agregó al carrito',
    )
  })
})
