const configurada: unknown = import.meta.env.VITE_API_URL

export const API_URL: string =
  typeof configurada === 'string' && configurada !== ''
    ? configurada
    : 'http://localhost:3000'
