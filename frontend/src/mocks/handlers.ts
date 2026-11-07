import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('http://localhost:3000/productos', () => HttpResponse.json([])),
]