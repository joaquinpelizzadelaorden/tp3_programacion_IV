import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CartProvider, useCart } from './CartContext'

function CartControls() {
  const { carrito, dispatch } = useCart()

  return (
    <>
      <button
        onClick={() =>
          dispatch({
            type: 'agregar',
            producto: {
              id: 'p1',
              tipo: 'pasteleria',
              nombre: 'Muffin de chocolate',
              precio: 2500,
            },
          })
        }
      >
        Agregar muffin
      </button>
      <p>
        {carrito.length === 0
          ? 'Carrito vacío'
          : `${carrito[0].producto.nombre}: ${carrito[0].cantidad}`}
      </p>
    </>
  )
}

describe('CartProvider', () => {
  it('comparte el estado y las acciones del reducer con sus consumidores', () => {
    render(
      <CartProvider>
        <CartControls />
      </CartProvider>,
    )

    expect(screen.getByText('Carrito vacío')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Agregar muffin' }))
    expect(screen.getByText('Muffin de chocolate: 1')).toBeInTheDocument()
  })
})
