import { useEffect, useState } from 'react'
import { obtenerProductos } from './api/client'
import type { Producto } from './api/schemas'
import { useCart } from './cart/CartContext'
import {
  buscarCafe,
  obtenerDescripcionOrigen,
  obtenerOrigen,
  obtenerTamanio,
} from './lib/cafe'
import type { Bebida, Cafe, EleccionCafe } from './lib/cafe'
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
  const { dispatch } = useCart()

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
  }

  function agregarCafe() {
    if (!cafeElegido) return
    agregarProducto(cafeElegido)
  }

  return (
    <main className="container py-5">
      <h1 className="mb-4">Menú</h1>
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
                  <div className="d-flex flex-wrap gap-2">
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
                  <div className="d-flex flex-wrap gap-2">
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
                  <div className="d-flex flex-column gap-2">
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
                    disabled={!cafeElegido}
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
