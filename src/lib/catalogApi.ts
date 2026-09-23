import { getAuthToken } from './authApi'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export type CatalogItem = { id: string; name: string; description?: string; address?: string }
export type CatalogType = 'categories' | 'locations'

const endpoint = (type: CatalogType) => `${apiUrl}/catalog.php?type=${type}`

export async function getCatalog(type: CatalogType): Promise<CatalogItem[]> {
  const response = await fetch(endpoint(type), { headers: { 'X-Auth-Token': getAuthToken() ?? '' } })
  if (!response.ok) throw new Error('No se pudo cargar la configuración.')
  return await response.json() as CatalogItem[]
}

export async function saveCatalogItem(type: CatalogType, item: { id?: string; name: string; description?: string; address?: string }): Promise<void> {
  const response = await fetch(endpoint(type), {
    method: item.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getAuthToken() ?? '' },
    body: JSON.stringify(item),
  })
  if (!response.ok) throw new Error((await response.json()).error || 'No se pudo guardar.')
}

export async function deleteCatalogItem(type: CatalogType, id: string): Promise<void> {
  const response = await fetch(`${endpoint(type)}&id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getAuthToken() ?? '' },
    body: JSON.stringify({ id }),
  })
  if (!response.ok) throw new Error((await response.json()).error || 'No se pudo eliminar.')
}