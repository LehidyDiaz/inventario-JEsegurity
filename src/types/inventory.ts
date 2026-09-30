export type Id = number
export type UserRole = 'Administrador' | 'Supervisor' | 'Operador' | 'Técnico' | 'Inspector' | string

export type AuthUser = { id: Id; name: string; email: string; role: UserRole; roleId: Id; phone: string; department: string; location: string; status: string; shift: string; rating: number; skills: string[]; nextAssignment: string }
export type InventoryStatus = 'En stock' | 'Stock bajo' | 'Agotado'
export type Category = { id: Id; name: string; description: string }
export type Location = { id: Id; name: string; address: string; active: boolean }
export type Role = { id: Id; name: string; description: string }

export type Product = {
  id: Id
  name: string
  sku: string
  categoryId: Id
  category: string
  purchasePrice: number
  quantity: number
  minimum: number
  unit: string
  locationId: Id | null
  location: string | null
  status: InventoryStatus
  updatedAt: string
}

export type Supplier = {
  id: Id; name: string; category: string; contact: string; phone: string; email: string
  rating: number; status: string; productIds: Id[]; products: string[]
}
export type Client = { id: Id; name: string; contact: string; phone: string; email: string; address: string }
export type Service = {
  id: Id; folio: string; title: string; clientId: Id | null; client: string; location: string; scheduledAt: string
  type: string; status: string; notes: string; assignedUserIds: Id[]; assignedTo: string[]
}
export type User = {
  id: Id; name: string; email: string; roleId: Id; role: string; phone: string; department: string
  location: string; status: string; shift: string; rating: number; skills: string[]; nextAssignment: string
}
export type MovementItem = { productId: Id; product: string; category: string; quantity: number; unit: string }
export type Movement = {
  id: Id; folio: string; type: 'in' | 'out' | 'adjustment'; reference: string; origin: string; status: string
  date: string; supplierId: Id | null; serviceId: Id | null; user: string; reviewedBy: Id | null
  reviewedAt: string | null; rejectionReason: string | null; items: MovementItem[]
}

export type Notification = { id: Id; type: string; title: string; message: string; priority: 'low' | 'medium' | 'high' | string; actionUrl: string | null; readAt: string | null; data: Record<string, unknown>; createdAt: string }
export type NotificationPreferences = { stock: boolean; services: boolean; movements: boolean; expirations: boolean; purchases: boolean }
export type ProductBatch = { id: Id; productId: Id; product: string; lotNumber: string; serialNumber: string | null; quantity: number; expirationDate: string | null; nextInspectionAt: string | null; status: 'Activo' | 'Vencido' | 'Consumido'; notes: string }
export type ExpirationSummary = { expired: number; upcoming: number; inspectionsDue: number }
export type PurchaseOrderItem = { id: Id; productId: Id; product: string; orderedQuantity: number; receivedQuantity: number; pendingQuantity: number; unitPrice: number }
export type PurchaseOrder = { id: Id; folio: string; supplierId: Id; supplier: string; orderDate: string; expectedDate: string | null; status: 'Borrador' | 'Enviada' | 'Parcial' | 'Recibida' | 'Cancelada'; notes: string; total: number; createdBy: Id; approvedBy: Id | null; items: PurchaseOrderItem[] }
export type AttachmentEntity = 'products' | 'services' | 'movements' | 'purchase-orders'
export type Attachment = { id: Id; entityType: AttachmentEntity; entityId: Id; originalName: string; mime: string; size: number; uploadedBy: Id; uploader: string; createdAt: string; downloadUrl: string }
export type SearchResult = { section: 'products' | 'services' | 'suppliers' | 'clients' | 'users'; id: Id; title: string; subtitle: string; action: string }
export type AuditLog = { id: Id; userId: Id | null; user: string | null; action: string; auditableType: string; auditableId: Id | null; description: string | null; oldValues: Record<string, unknown>; newValues: Record<string, unknown>; ip: string | null; userAgent: string | null; timestamp: string }
export type DashboardReport = { inventoryValue: number; totalProducts: number; lowStock: number; pendingMovements: number; upcomingServices: number; overdueServices: number }
export type SupplierReport = { id: Id; name: string; status: string; productCount: number; orderCount: number; purchaseTotal: number }
export type ProductTrace = { product: Product; movements: Array<{ id: Id; folio: string; type: Movement['type']; status: string; date: string; quantity: number; user: string }>; batches: ProductBatch[]; suppliers: Array<{ id: Id; name: string }>; services: Service[]; purchases: Array<{ id: Id; folio: string; supplier: string; orderedQuantity: number; receivedQuantity: number }>; totals: { currentStock: number; batchQuantity: number; movementCount: number; supplierCount: number } }
export type ProductLabel = { id: Id; sku: string; name: string; url: string }

export type ProductPayload = Omit<Product, 'id' | 'category' | 'location' | 'status' | 'updatedAt'>
export type SupplierPayload = Omit<Supplier, 'id' | 'products'>
export type ClientPayload = Omit<Client, 'id'>
export type ServicePayload = Omit<Service, 'id' | 'folio' | 'client' | 'assignedTo'>
export type UserPayload = Omit<User, 'id' | 'role'> & { password?: string }
export type MovementPayload = Omit<Movement, 'id' | 'folio' | 'user' | 'reviewedBy' | 'reviewedAt' | 'rejectionReason' | 'items'> & { items: Array<{ productId: Id; quantity: number }> }
export type ProductBatchPayload = Omit<ProductBatch, 'id' | 'product'>
export type PurchaseOrderPayload = Pick<PurchaseOrder, 'supplierId' | 'orderDate' | 'expectedDate' | 'status' | 'notes'> & { items: Array<{ productId: Id; orderedQuantity: number; unitPrice: number }> }
