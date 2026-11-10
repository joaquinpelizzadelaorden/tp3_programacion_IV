import { expect, test } from '@playwright/test'

const apiUrl = 'http://127.0.0.1:3000'

test.beforeEach(async ({ request }) => {
  const reset = await request.post(`${apiUrl}/__test__/reset`)
  expect(reset.ok()).toBeTruthy()

  const seed = await request.post(`${apiUrl}/__test__/seed`)
  expect(seed.ok()).toBeTruthy()
})

test('permite elegir un café, agregarlo, confirmar y consultar el pedido', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Expreso', exact: true }).click()
  await page.getByRole('button', { name: 'Pocillo', exact: true }).click()
  await page.getByRole('button', { name: /Brasil/ }).click()
  await page.getByRole('button', { name: 'Agregar al carrito' }).click()

  await expect(page.getByRole('list', { name: 'Productos del carrito' }))
    .toContainText('Expreso Pocillo Brasil')
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()

  await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toBeVisible()
  await expect(page.getByText('Estado: pendiente')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Productos del pedido' }))
    .toContainText('Expreso Pocillo Brasil')
  const numeroPedido = page.getByText(/^Número de pedido: pedido-/)
  await expect(numeroPedido).toBeVisible()
  const idPedido = (await numeroPedido.innerText()).match(/pedido-[\w-]+/)?.[0]
  expect(idPedido).toBeTruthy()

  const respuestaDeSeguimiento = page.waitForResponse((respuesta) =>
    respuesta.url() === `${apiUrl}/pedidos/${idPedido}` &&
    respuesta.request().method() === 'GET',
  )
  await page.getByRole('button', { name: 'Actualizar estado' }).click()
  const respuesta = await respuestaDeSeguimiento
  expect(respuesta.ok()).toBeTruthy()
  const pedido = await respuesta.json() as {
    id: string
    items: { productoId: string; cantidad: number }[]
    estado: string
    total: number
  }
  expect(pedido).toMatchObject({
    id: idPedido,
    items: [{ productoId: 'c1', cantidad: 1 }],
    estado: 'pendiente',
  })
  expect(pedido.total).toBeGreaterThan(0)
})

test('se adapta a 375 px sin desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Menú' })).toBeVisible()
  const ancho = await page.evaluate(() => ({
    contenido: document.documentElement.scrollWidth,
    ventana: document.documentElement.clientWidth,
  }))
  expect(ancho.contenido).toBeLessThanOrEqual(ancho.ventana)
})
