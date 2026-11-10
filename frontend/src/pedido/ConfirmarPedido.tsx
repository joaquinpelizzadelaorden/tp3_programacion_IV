import { useState } from 'react'
import { crearPedido } from '../api/client'
import { useCart } from '../cart/CartContext'
import { formatearPrecio } from '../lib/precio'
import { SeguimientoPedido } from './SeguimientoPedido'

type Resultado = Awaited<ReturnType<typeof crearPedido>>

type EnvioPedido =
  | { estado: 'inactivo' }
  | { estado: 'enviando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'confirmado'; resultado: Resultado }

type Props = { mesaId?: string }

export function ConfirmarPedido({ mesaId }: Props) {
  const { carrito, dispatch } = useCart()
  const [envio, setEnvio] = useState<EnvioPedido>({ estado: 'inactivo' })

  async function confirmar() {
    setEnvio({ estado: 'enviando' })
    try {
      const resultado = await crearPedido({
        ...(mesaId !== undefined && { mesaId }),
        items: carrito.map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
        })),
      })
      dispatch({ type: 'vaciar' })
      setEnvio({ estado: 'confirmado', resultado })
    } catch (error) {
      setEnvio({
        estado: 'error',
        mensaje:
          error instanceof Error ? error.message : 'No pudimos enviar el pedido. Probá de nuevo.',
      })
    }
  }

  if (envio.estado === 'confirmado') {
    const { pedido, total } = envio.resultado
    return (
      <section aria-labelledby="pedido-confirmado">
        <h2 id="pedido-confirmado">¡Pedido confirmado!</h2>
        <p>Número de pedido: {pedido.id}</p>
        <p>Total: {formatearPrecio(total)}</p>
        <SeguimientoPedido pedidoId={pedido.id} estadoInicial={pedido.estado} />
      </section>
    )
  }

  return (
    <div>
      {envio.estado === 'error' && <p role="alert">{envio.mensaje}</p>}
      <button
        type="button"
        className="btn btn-primary"
        disabled={carrito.length === 0 || envio.estado === 'enviando'}
        onClick={confirmar}
      >
        Confirmar pedido
      </button>
    </div>
  )
}