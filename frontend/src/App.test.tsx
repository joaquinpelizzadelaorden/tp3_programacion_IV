import { delay, http, HttpResponse } from 'msw'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
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
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('muestra la mesa en el encabezado cuando viene en la URL', async () => {
    window.history.pushState({}, '', '/?mesa=4')
    renderApp()

    expect(screen.getByRole('heading', { name: 'Mesa 4' })).toBeInTheDocument()
  })

  it('muestra retiro en la barra cuando la URL no tiene mesa', async () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Retiro en la barra' })).toBeInTheDocument()
  })

  it('muestra y actualiza cantidades y subtotales del carrito, y no permite confirmar vacío', async () => {
    server.use(
      http.get(`${API_URL}/productos`, () => HttpResponse.json([muffin])),
    )
    const user = userEvent.setup()
    renderApp()

    expect(await screen.findByText('Tu carrito está vacío.')).toBeInTheDocument()
    const confirmar = screen.getByRole('button', { name: 'Confirmar pedido' })
    expect(confirmar).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Agregar Muffin de chocolate al carrito' }))
    expect(screen.getByText('Subtotal orientativo: $2.500')).toBeInTheDocument()
    expect(confirmar).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Sumar Muffin de chocolate' }))
    expect(screen.getByLabelText('Cantidad de Muffin de chocolate')).toHaveTextContent('2')
    expect(screen.getByText('$5.000')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Restar Muffin de chocolate' }))
    expect(screen.getByLabelText('Cantidad de Muffin de chocolate')).toHaveTextContent('1')
    await user.click(screen.getByRole('button', { name: 'Quitar Muffin de chocolate' }))
    expect(screen.getByText('Tu carrito está vacío.')).toBeInTheDocument()
    expect(confirmar).toBeDisabled()
  })

  it('confirma el pedido y vacía el carrito solo al tener éxito', async () => {
    server.use(
      http.get(`${API_URL}/productos`, () => HttpResponse.json([muffin])),
    )
    const user = userEvent.setup()
    renderApp()

    await user.click(
      await screen.findByRole('button', { name: 'Agregar Muffin de chocolate al carrito' }),
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

    expect(await screen.findByRole('heading', { name: '¡Pedido confirmado!' }))
      .toBeInTheDocument()
    expect(screen.getByText(/^Número de pedido: pedido-/)).toBeInTheDocument()
    expect(screen.getByText('Estado: pendiente')).toBeInTheDocument()
    expect(screen.getByText('Total: $2.500')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Productos del pedido' }))
      .toHaveTextContent('Muffin de chocolate')
    expect(screen.getByRole('button', { name: 'Actualizar estado' })).toBeEnabled()
    expect(screen.getByText('Tu carrito está vacío.')).toBeInTheDocument()
    expect(screen.queryByText('Muffin de chocolate se agregó al carrito'))
      .not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar pedido' })).toBeDisabled()
  })

  it('conserva el carrito y muestra el error si falla la confirmación', async () => {
    server.use(
      http.get(`${API_URL}/productos`, () => HttpResponse.json([muffin])),
      http.post(`${API_URL}/pedidos`, () =>
        HttpResponse.json({ error: 'Servidor no disponible' }, { status: 503 }),
      ),
    )
    const user = userEvent.setup()
    renderApp()

    await user.click(
      await screen.findByRole('button', { name: 'Agregar Muffin de chocolate al carrito' }),
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor no disponible')
    expect(screen.getByText('Subtotal orientativo: $2.500')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar pedido' })).toBeEnabled()
  })

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

  it('muestra los precios de pastelería y permite agregar cada producto al carrito', async () => {
    server.use(
      http.get(`${API_URL}/productos`, () =>
        HttpResponse.json([
          muffin,
          {
            id: 'p2',
            tipo: 'pasteleria',
            nombre: 'Torta selva negra',
            precio: 4200,
          },
        ]),
      ),
    )
    const user = userEvent.setup()
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Pastelería' })).toBeInTheDocument()
    expect(screen.getByText('Muffin de chocolate')).toBeInTheDocument()
    expect(screen.getByText(/\$2\.500/)).toBeInTheDocument()
    expect(screen.getByText('Torta selva negra')).toBeInTheDocument()
    expect(screen.getByText(/\$4\.200/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Agregar Muffin de chocolate al carrito' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Muffin de chocolate se agregó al carrito',
    )
    await user.click(screen.getByRole('button', { name: 'Agregar Torta selva negra al carrito' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Torta selva negra se agregó al carrito',
    )
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
    expect(screen.getByRole('group', { name: '1. Elegí tu bebida' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '2. Elegí el tamaño' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '3. Elegí el origen' })).toBeInTheDocument()

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
    screen.getAllByRole('button').forEach((button) => {
      expect(button).toHaveAccessibleName()
    })
  })
})
