export type InventoryStatus = 'En stock' | 'Stock bajo' | 'Agotado'

export type InventoryItem = {
  id: string
  name: string
  category: string
  sku: string
  quantity: number
  minimum: number
  unit: string
  location: string
  status: InventoryStatus
  updatedAt: string
}

export const inventoryItems: InventoryItem[] = [
  {
    id: 'ext-001',
    name: 'Extintor ABC 6 kg',
    category: 'Extintores',
    sku: 'EXT-ABC-006',
    quantity: 24,
    minimum: 10,
    unit: 'unidades',
    location: 'Almacén principal',
    status: 'En stock',
    updatedAt: 'Hoy, 08:42',
  },
  {
    id: 'ext-002',
    name: 'Extintor CO2 5 kg',
    category: 'Extintores',
    sku: 'EXT-CO2-005',
    quantity: 8,
    minimum: 12,
    unit: 'unidades',
    location: 'Almacén principal',
    status: 'Stock bajo',
    updatedAt: 'Ayer, 16:20',
  },
  {
    id: 'ppe-001',
    name: 'Guantes anticorte nivel 5',
    category: 'EPP',
    sku: 'EPP-GUA-005',
    quantity: 76,
    minimum: 30,
    unit: 'pares',
    location: 'EPP / Estantería A',
    status: 'En stock',
    updatedAt: 'Ayer, 14:05',
  },
  {
    id: 'ppe-002',
    name: 'Casco de seguridad blanco',
    category: 'EPP',
    sku: 'EPP-CAS-001',
    quantity: 5,
    minimum: 12,
    unit: 'unidades',
    location: 'EPP / Estantería B',
    status: 'Stock bajo',
    updatedAt: '12 jun, 11:34',
  },
  {
    id: 'sen-001',
    name: 'Señal salida de emergencia',
    category: 'Señalización',
    sku: 'SEN-SAL-002',
    quantity: 42,
    minimum: 20,
    unit: 'unidades',
    location: 'Señalización',
    status: 'En stock',
    updatedAt: '12 jun, 09:12',
  },
]

export const recentMovements = [
  { title: 'Salida por servicio', detail: 'Obra Centro Norte · 6 ítems', time: 'Hace 24 min', type: 'out' },
  { title: 'Entrada de proveedor', detail: 'Segurimax · 40 pares de guantes', time: 'Hace 2 h', type: 'in' },
  { title: 'Ajuste de inventario', detail: 'Almacén principal · Extintores', time: 'Ayer, 16:20', type: 'adjustment' },
]
