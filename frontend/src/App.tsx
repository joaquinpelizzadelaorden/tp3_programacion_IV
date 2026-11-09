import { useEffect, useState } from 'react'
import { obtenerProductos } from './api/client'
import type { Producto } from './api/schemas'

type EstadoMenu =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; productos: Producto[] }

function App() {
  const [estado, setEstado] = useState<EstadoMenu>({ estado: 'cargando' })
  const [intento, setIntento] = useState(0)

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

  return (
    <main>
      <h1>Menú</h1>
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
        <ul aria-label="Productos del menú">
          {estado.productos.map((producto) => (
            <li key={producto.id}>
              <span>{producto.nombre}</span>
              <span>{` — $${producto.precio}`}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
