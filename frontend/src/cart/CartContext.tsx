import { createContext, useContext, useReducer } from 'react'
import type { Dispatch, PropsWithChildren } from 'react'
import {
  carritoInicial,
  carritoReducer,
} from './carritoReducer'
import type { AccionCarrito, Carrito } from './carritoReducer'

export type CartContextValue = {
  carrito: Carrito
  dispatch: Dispatch<AccionCarrito>
}

// El contexto es parte de la API compartida del proveedor y su hook.
// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: PropsWithChildren) {
  const [carrito, dispatch] = useReducer(carritoReducer, carritoInicial)

  return (
    <CartContext.Provider value={{ carrito, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart debe usarse dentro de un CartProvider')
  }
  return context
}
