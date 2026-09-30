import { resourceApi } from './api'
import type { Product, ProductPayload } from '../types/inventory'

export const productsApi = resourceApi<Product, ProductPayload>('products')
export const getProducts = productsApi.list
export const createProduct = productsApi.create
export const updateProduct = (product: ProductPayload & { id: number }) => productsApi.update(product.id, product)
export const deleteProduct = productsApi.remove
