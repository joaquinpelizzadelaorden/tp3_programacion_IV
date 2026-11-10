# Cafetería Origen — Menú digital y API de pedidos

Este repositorio contiene la API REST de Cafetería Origen y un menú web para que los clientes consulten productos y envíen pedidos desde su mesa. El frontend consume la API del proyecto; en las pruebas de interfaz se usan MSW y Playwright.

## Características Técnicas

El desarrollo se basó en los siguientes pilares:

- **POO**:
  - **Abstracción**: Se definió una clase abstracta `Producto` para establecer la estructura común.
  - **Polimorfismo**: Implementación de `calcularPrecio()` mediante `override` en las clases `Cafe` y `Pasteleria`.
  - **Encapsulamiento**: Uso de atributos privados con acceso a través de getters y setters.
  - **Agregación**: El `Pedido` contiene una lista de productos independientes.
- **TypeScript**: Configuración en modo `strict` para garantizar la seguridad de tipos y evitar errores en tiempo de ejecución.
- **Testing**: Suite de pruebas con **Vitest**, incluyendo tests unitarios para los cálculos de precios y tests de integración con mocks para los endpoints de la API.

## Tecnologías

- **API**: TypeScript, Node.js y Express.
- **Frontend**: React, TypeScript, Vite, Bootstrap y SASS.
- **Tests**: Vitest, React Testing Library, MSW y Playwright.
- **Contenedores**: Docker (opcional).

## Instalación y ejecución local

### Requisitos

- Node.js 20.19+ o 22.12+ (requisito de Vite 7).
- npm.
- Docker es opcional; solo se necesita para ejecutar la API en un contenedor.

En PowerShell, mirá la ruta que aparece antes de `>` en el prompt. Si termina en `\frontend>`, ya estás dentro de `frontend/`: no vuelvas a ejecutar `cd frontend`. Para regresar a la raíz del repositorio, usá `cd ..`.

### Instalar dependencias

Los dos `package.json` tienen sus propios lockfiles. Instalá las dependencias por separado:

Desde la **raíz del repositorio**:

```bash
npm ci
```

Desde la **raíz del repositorio**, instalá también las dependencias del frontend:

```bash
cd frontend
npm ci
```

### Levantar la aplicación

Usá dos terminales. La API y el frontend deben estar ejecutándose al mismo tiempo para usar la aplicación manualmente.

Terminal 1, desde la **raíz del repositorio**. Si esta terminal quedó en `frontend/` después de instalar las dependencias, primero ejecutá `cd ..` para volver a la raíz. Luego iniciá la API:

```bash
npm start
```

La API queda disponible en `http://localhost:3000`.

Terminal 2, desde la **raíz del repositorio**:

```bash
cd frontend
npm run dev
```

El menú queda disponible en `http://localhost:5173`. Para probar la mesa 4, abrí `http://localhost:5173/?mesa=4`. Sin mesa válida, el pedido se prepara para retirar en la barra.

## Ejecutar las pruebas

### API

Desde la **raíz del repositorio**:

```bash
npm test
```

Ejecuta los tests de la API en `tests/`. No requiere iniciar el servidor.

### Frontend: unitarios, componentes e integración

Desde la **raíz del repositorio**:

```bash
cd frontend
npm test
npm run lint
npm run build
```

Vitest y MSW ejecutan unitarios, componentes e integración sin levantar la API. Los otros dos comandos comprueban estilo y tipos y generan el build de producción.

### E2E con Playwright

Las pruebas E2E usan el frontend y la API reales. Playwright inicia ambos servidores automáticamente; no los inicies manualmente para esta prueba. La API corre con `NODE_ENV=test`, que es el único entorno donde están habilitados `/__test__/reset` y `/__test__/seed`. Los puertos `3000` y `5173` deben estar disponibles.

Instalá Chromium **una vez** y ejecutá E2E desde la **raíz del repositorio**:

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

En Linux, si faltan bibliotecas del sistema, reemplazá el comando de instalación de Chromium por:

```bash
npx playwright install --with-deps chromium
```

Playwright restaura los datos con `reset` y `seed` antes de cada caso. Para abrir el modo interactivo:

```bash
cd frontend
npm run test:e2e:ui
```

### CORS

La API permite por defecto solicitudes desde `http://localhost:5173` (el puerto predeterminado de Vite). Para autorizar otros orígenes, como una lista de orígenes separados por comas, por ejemplo:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

La variable también se puede configurar en el entorno del servidor.

### Ejecución con Docker

1. **Construir la imagen**:

   ```bash
   docker build -t cafeteria-origen .
   ```

2. **Ejecutar el contenedor**:

   ```bash
   docker run -p 3000:3000 cafeteria-origen
   ```

La API expone un contrato JSON con base en `http://localhost:3000` y responde siempre con contenido `application/json` salvo la ruta raíz, que devuelve texto plano.

