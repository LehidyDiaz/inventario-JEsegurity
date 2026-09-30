import { resourceApi } from './api'
import type { Client, ClientPayload, Movement, MovementPayload, ProductBatch, ProductBatchPayload, PurchaseOrder, PurchaseOrderPayload, Service, ServicePayload, Supplier, SupplierPayload, User, UserPayload } from '../types/inventory'

export const suppliersApi = resourceApi<Supplier, SupplierPayload>('suppliers')
export const clientsApi = resourceApi<Client, ClientPayload>('clients')
export const servicesApi = resourceApi<Service, ServicePayload>('services')
export const usersApi = resourceApi<User, UserPayload>('users')
export const movementsApi = resourceApi<Movement, MovementPayload>('movements')
export const batchesApi = resourceApi<ProductBatch, ProductBatchPayload>('product-batches')
export const purchasesApi = resourceApi<PurchaseOrder, PurchaseOrderPayload>('purchase-orders')
