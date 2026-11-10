import { useEffect, useState } from 'react'
import { crearPedido, obtenerProductos } from './api/client'
import type { Producto } from './api/schemas'
import { useCart } from './cart/CartContext'
import { subtotalCarrito, subtotalItem } from './cart/carritoReducer'
import {
  buscarCafe,
  obtenerDescripcionOrigen,
  obtenerOrigen,
  obtenerTamanio,
} from './lib/cafe'
import type { Bebida, Cafe, EleccionCafe } from './lib/cafe'
import { leerMesa } from './lib/mesa'
import { formatearPrecio } from './lib/precio'

type EstadoMenu =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; productos: Producto[] }

function App() {
  const [estado, setEstado] = useState<EstadoMenu>({ estado: 'cargando' })
  const [intento, setIntento] = useState(0)
  const [eleccion, setEleccion] = useState<EleccionCafe>({})
  const [mensajeAgregado, setMensajeAgregado] = useState('')
  const [pedidoEnviando, setPedidoEnviando] = useState(false)
  const [mensajePedido, setMensajePedido] = useState('')
  const [errorPedido, setErrorPedido] = useState('')
  const { carrito, dispatch } = useCart()
  const mesa = leerMesa(window.location.search)
  const tituloPedido = mesa === null ? 'Retiro en la barra' : `Mesa ${mesa}`

  useEffect(() => {
    let vigente = true

    obtenerProductos()
      .then((productos) => {
        if (vigente) setEstado({ estado: 'listo', productos })
      })
      .catch((error: unknown) => {
        if (vigente) {
          setEstado({
            estado: 'error',
            mensaje: error instanceof Error ? error.message : 'No se pudo cargar el menú',
          })
        }
      })

    return () => {
      vigente = false
    }
  }, [intento])

  function reintentar() {
    setEstado({ estado: 'cargando' })
    setIntento((actual) => actual + 1)
  }

  const cafes =
    estado.estado === 'listo'
      ? estado.productos.filter((producto): producto is Cafe => producto.tipo !== 'pasteleria')
      : []
  const bebidas = [...new Set(cafes.map((cafe) => cafe.tipo))]
  const tamanios = [
    ...new Set(
      cafes
        .filter((cafe) => cafe.tipo === eleccion.bebida)
        .map(obtenerTamanio)
        .filter((tamanio): tamanio is string => tamanio !== undefined),
    ),
  ]
  const origenes =
    eleccion.bebida && eleccion.tamanio
      ? cafes.filter(
          (cafe) =>
            cafe.tipo === eleccion.bebida && obtenerTamanio(cafe) === eleccion.tamanio,
        )
      : []
  const cafeElegido = buscarCafe(cafes, eleccion)

  function elegirBebida(bebida: Bebida) {
    setEleccion({ bebida })
    setMensajeAgregado('')
  }

  function elegirTamanio(tamanio: string) {
    setEleccion((actual) => ({ bebida: actual.bebida, tamanio }))
    setMensajeAgregado('')
  }

  function elegirOrigen(origen: string) {
    setEleccion((actual) => ({ ...actual, origen }))
    setMensajeAgregado('')
  }

  function agregarProducto(producto: Producto) {
    dispatch({ type: 'agregar', producto })
    setMensajeAgregado(`${producto.nombre} se agregó al carrito`)
    setMensajePedido('')
    setErrorPedido('')
  }

  function agregarCafe() {
    if (!cafeElegido) return
    agregarProducto(cafeElegido)
  }

  async function confirmarPedido() {
    if (carrito.length === 0 || pedidoEnviando) return

    setPedidoEnviando(true)
    setMensajePedido('')
    setErrorPedido('')
    try {
      const resultado = await crearPedido({
        mesaId: mesa ? `mesa-${mesa}` : undefined,
        items: carrito.map(({ producto, cantidad }) => ({
          productoId: producto.id,
          cantidad,
        })),
      })
      // FASE VERDE: El carrito solo se vacía si la API responde con éxito
      dispatch({ type: 'vaciar' })
      setMensajePedido(
        `Pedido ${resultado.pedido.id} confirmado. Total: ${formatearPrecio(resultado.total)}`,
      )
    } catch (error: unknown) {
      setErrorPedido(
        error instanceof Error ? error.message : 'No se pudo confirmar el pedido',
      )
    } finally {
      setPedidoEnviando(false)
    }
  }

  return (
    <main className="container py-5">
      <header className="mb-4">
        <p className="text-uppercase small text-muted mb-1">Pedido</p>
        <h1>{tituloPedido}</h1>
      </header>
      <h2 className="mb-4">Menú</h2>
      <section aria-labelledby="titulo-carrito" className="mb-5">
        <h2 id="titulo-carrito">Carrito</h2>
        {carrito.length === 0 ? (
          <p>Tu carrito está vacío.</p>
        ) : (
          <ul aria-label="Productos del carrito" className="list-unstyled">
            {carrito.map(({ producto, cantidad }) => (
              <li key={producto.id} className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="me-auto">{producto.nombre}</span>
                <span>{formatearPrecio(subtotalItem({ producto, cantidad }))}</span>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  aria-label={`Restar ${producto.nombre}`}
                  disabled={pedidoEnviando}
                  onClick={() => dispatch({ type: 'restar', productoId: producto.id })}
                >
                  −
                </button>
                <span aria-label={`Cantidad de ${producto.nombre}`}>{cantidad}</span>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  aria-label={`Sumar ${producto.nombre}`}
                  disabled={pedidoEnviando}
                  onClick={() => dispatch({ type: 'sumar', productoId: producto.id })}
                >
                  +
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  aria-label={`Quitar ${producto.nombre}`}
                  disabled={pedidoEnviando}
                  onClick={() => dispatch({ type: 'quitar', productoId: producto.id })}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
        <p>
          <strong>Subtotal orientativo: {formatearPrecio(subtotalCarrito(carrito))}</strong>
        </p>
        <button
          type="button"
          className="btn btn-primary"
          disabled={carrito.length === 0 || pedidoEnviando}
          onClick={confirmarPedido}
        >
          {pedidoEnviando ? 'Confirmando…' : 'Confirmar pedido'}
        </button>
        {mensajePedido && <p role="status" className="mt-3">{mensajePedido}</p>}
        {errorPedido && <p role="alert" className="mt-3">{errorPedido}</p>}
      </section>
      {estado.estado === 'cargando' && (
        <p role="status" aria-live="polite">
          Cargando menú…
        </p>
      )}
      {estado.estado === 'error' && (
        <div role="alert">
          <p>{estado.mensaje}</p>
          <button type="button" onClick={reintentar}>
            Reintentar
          </button>
        </div>
      )}
      {estado.estado === 'listo' && (
        <>
          {cafes.length > 0 && (
            <section aria-labelledby="selector-cafe" className="mb-5">
              <h2 id="selector-cafe">Armá tu café</h2>
              <div className="row g-4">
                <section className="col-12 col-md-4" aria-labelledby="paso-bebida">
                  <h3 id="paso-bebida" className="h5">1. Elegí tu bebida</h3>
                  <div
                    role="group"
                    aria-labelledby="paso-bebida"
                    className="d-flex flex-wrap gap-2"
                  >
                    {bebidas.map((bebida) => (
                      <button
                        key={bebida}
                        type="button"
                        className={`btn ${eleccion.bebida === bebida ? 'btn-primary' : 'btn-outline-primary'}`}
                        aria-pressed={eleccion.bebida === bebida}
                        onClick={() => elegirBebida(bebida)}
                      >
                        {bebida === 'expreso' ? 'Expreso' : 'Filtrado'}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="col-12 col-md-4" aria-labelledby="paso-tamanio">
                  <h3 id="paso-tamanio" className="h5">2. Elegí el tamaño</h3>
                  <div
                    role="group"
                    aria-labelledby="paso-tamanio"
                    className="d-flex flex-wrap gap-2"
                  >
                    {tamanios.map((tamanio) => (
                      <button
                        key={tamanio}
                        type="button"
                        className={`btn ${eleccion.tamanio === tamanio ? 'btn-primary' : 'btn-outline-primary'}`}
                        aria-pressed={eleccion.tamanio === tamanio}
                        onClick={() => elegirTamanio(tamanio)}
                      >
                        {tamanio}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="col-12 col-md-4" aria-labelledby="paso-origen">
                  <h3 id="paso-origen" className="h5">3. Elegí el origen</h3>
                  <div
                    role="group"
                    aria-labelledby="paso-origen"
                    className="d-flex flex-column gap-2"
                  >
                    {origenes.map((cafe) => {
                      const origen = obtenerOrigen(cafe)
                      if (!origen) return null
                      return (
                        <button
                          key={cafe.id}
                          type="button"
                          className={`btn text-start ${eleccion.origen === origen ? 'btn-primary' : 'btn-outline-primary'}`}
                          aria-pressed={eleccion.origen === origen}
                          onClick={() => elegirOrigen(origen)}
                        >
                          <span>{origen}</span>
                          <span className="float-end">{formatearPrecio(cafe.precio)}</span>
                        </button>
                      )
                    })}
                  </div>
                  {cafeElegido && (
                    <p className="mt-3" aria-live="polite">
                      {obtenerDescripcionOrigen(cafeElegido)}
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary mt-2"
                    disabled={!cafeElegido || pedidoEnviando}
                    onClick={agregarCafe}
                  >
                    Agregar al carrito
                  </button>
                </section>
              </div>
            </section>
          )}
          {mensajeAgregado && <p role="status" className="mb-3">{mensajeAgregado}</p>}
          <section aria-labelledby="pasteleria">
            <h2 id="pasteleria">Pastelería</h2>
            <ul aria-label="Productos del menú">
              {estado.productos
                .filter((producto) => producto.tipo === 'pasteleria')
                .map((producto) => (
                  <li key={producto.id}>
                    <span>{producto.nombre}</span>
                    <span>{` — ${formatearPrecio(producto.precio)}`}</span>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm ms-3"
                      disabled={pedidoEnviando}
                      onClick={() => agregarProducto(producto)}
                    >
                      {`Agregar ${producto.nombre} al carrito`}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}

export default App