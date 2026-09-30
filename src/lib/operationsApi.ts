import { apiDownload, apiFormRequest, apiRequest } from './api'
import type { Attachment, AttachmentEntity, AuditLog, DashboardReport, ExpirationSummary, Notification, NotificationPreferences, Product, ProductLabel, ProductTrace, SearchResult, Service, SupplierReport } from '../types/inventory'

const query = (values: Record<string, string | number | null | undefined>) => {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== '' && value != null) params.set(key, String(value)) })
  const result = params.toString(); return result ? `?${result}` : ''
}

export const notificationsApi = {
  list: (unread = false) => apiRequest<Notification[]>(`/notifications${unread ? '?unread=1' : ''}`),
  read: (id: number) => apiRequest<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAll: () => apiRequest<{ updated: number }>('/notifications/read-all', { method: 'POST' }),
  refresh: () => apiRequest<{ created: number }>('/notifications/refresh', { method: 'POST' }),
  preferences: () => apiRequest<NotificationPreferences>('/notification-preferences'),
  updatePreferences: (body: NotificationPreferences) => apiRequest<NotificationPreferences>('/notification-preferences', { method: 'PUT', body }),
}
export const attachmentsApi = {
  list: (entityType: AttachmentEntity, entityId: number) => apiRequest<Attachment[]>(`/attachments${query({ entityType, entityId })}`),
  upload: (entityType: AttachmentEntity, entityId: number, file: File) => { const form = new FormData(); form.set('entityType', entityType); form.set('entityId', String(entityId)); form.set('file', file); return apiFormRequest<Attachment>('/attachments', form) },
  download: (item: Attachment) => apiDownload(`/attachments/${item.id}/download`, item.originalName),
  remove: (id: number) => apiRequest<void>(`/attachments/${id}`, { method: 'DELETE' }),
}
export const reportsApi = {
  dashboard: () => apiRequest<DashboardReport>('/reports/dashboard'), inventory: () => apiRequest<Array<Product & { stockValue: number }>>('/reports/inventory'),
  movements: (from = '', to = '') => apiRequest<import('../types/inventory').Movement[]>(`/reports/movements${query({ from, to })}`),
  services: (from = '', to = '') => apiRequest<Service[]>(`/reports/services${query({ from, to })}`), suppliers: () => apiRequest<SupplierReport[]>('/reports/suppliers'),
  csv: (report: string, from = '', to = '') => apiDownload(`/reports/${report}/csv${query({ from, to })}`, `${report}.csv`),
}
export const operationsApi = {
  expirationSummary: () => apiRequest<ExpirationSummary>('/expirations/summary'), trace: (id: number) => apiRequest<ProductTrace>(`/products/${id}/trace`), label: (id: number) => apiRequest<ProductLabel>(`/products/${id}/label`),
  search: (value: string) => apiRequest<SearchResult[]>(`/search${query({ q: value })}`), audit: (filters: Record<string, string>) => apiRequest<AuditLog[]>(`/audit-logs${query(filters)}`),
}
