import { useState } from 'react'
import { obtenerPedido } from '../api/client'

type Consulta =
  | { estado: 'inactiva' }
  | { estado: 'consultando' }
  | { estado: 'error'; mensaje: string }

type Props = {
  pedidoId: string
  estadoInicial: string
}

export function SeguimientoPedido({ pedidoId, estadoInicial }: Props) {
  const [estadoPedido, setEstadoPedido] = useState(estadoInicial)
  const [consulta, setConsulta] = useState<Consulta>({ estado: 'inactiva' })

  async function actualizar() {
    setConsulta({ estado: 'consultando' })
    try {
      const pedido = await obtenerPedido(pedidoId)
      setEstadoPedido(pedido.estado)
      setConsulta({ estado: 'inactiva' })
    } catch (error) {
      setConsulta({
        estado: 'error',
        mensaje:
          error instanceof Error
            ? error.message
            : 'No pudimos consultar el pedido. Probá de nuevo.',
      })
    }
  }

  return (
    <section aria-labelledby="seguimiento-pedido">
      <h2 id="seguimiento-pedido">Seguimiento del pedido</h2>
      <p>Estado: {estadoPedido}</p>
      {consulta.estado === 'error' && <p role="alert">{consulta.mensaje}</p>}
      <button
        type="button"
        className="btn btn-outline-primary"
        disabled={consulta.estado === 'consultando'}
        onClick={actualizar}
      >
        Actualizar estado
      </button>
    </section>
  )
}