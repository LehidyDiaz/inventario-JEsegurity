import type { InventoryItem } from '../types/inventory'
import { getAuthToken } from './authApi'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

type ProductPayload = Omit<InventoryItem, 'id' | 'status' | 'updatedAt'>

const getStatus = (quantity: number, minimum: number): InventoryItem['status'] => {
  if (quantity === 0) return 'Agotado'
  if (quantity <= minimum) return 'Stock bajo'
  return 'En stock'
}

const mapProduct = (product: Omit<InventoryItem, 'status'> & { minimum_quantity?: number }) => ({
  ...product,
  purchasePrice: Number(product.purchasePrice ?? 0),
  quantity: Number(product.quantity),
  minimum: Number(product.minimum ?? product.minimum_quantity),
  status: getStatus(Number(product.quantity), Number(product.minimum ?? product.minimum_quantity)),
})

export async function getProducts(): Promise<InventoryItem[]> {
  const response = await fetch(`${apiUrl}/products.php`, { headers: { 'X-Auth-Token': getAuthToken() ?? '' } })
  if (!response.ok) throw new Error('No se pudo cargar el inventario desde MySQL.')
  const products = await response.json() as Array<Omit<InventoryItem, 'status'>>
  return products.map(mapProduct)
}

export async function createProduct(product: ProductPayload): Promise<void> {
  const response = await fetch(`${apiUrl}/products.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getAuthToken() ?? '' },
    body: JSON.stringify(product),
  })
  if (!response.ok) throw new Error((await response.json()).error || 'No se pudo guardar el producto.')
}

export async function updateProduct(product: InventoryItem): Promise<void> {
  const response = await fetch(`${apiUrl}/products.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getAuthToken() ?? '' },
    body: JSON.stringify(product),
  })
  if (!response.ok) throw new Error((await response.json()).error || 'No se pudo actualizar el producto.')
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${apiUrl}/products.php?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'X-Auth-Token': getAuthToken() ?? '' } })
  if (!response.ok) throw new Error('No se pudo eliminar el producto.')
}