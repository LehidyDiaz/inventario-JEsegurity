export type InventoryStatus = 'En stock' | 'Stock bajo' | 'Agotado'

export type InventoryItem = {
  id: string
  name: string
  category: string
  sku: string
  purchasePrice?: number
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

export type MovementRecord = {
  id: string
  type: 'in' | 'out' | 'adjustment'
  product: string
  reference: string
  category: string
  quantity: number
  unit: string
  origin: string
  date: string
  user: string
  status: 'Confirmado' | 'Pendiente' | 'Revisión'
}

export const movements: MovementRecord[] = [
  {
    id: 'mv-101',
    type: 'out',
    product: 'Extintor ABC 6 kg',
    reference: 'Salida · Obra Centro Norte',
    category: 'Extintores',
    quantity: 6,
    unit: 'unidades',
    origin: 'Obra Centro Norte',
    date: '2025-06-16 09:45',
    user: 'María R.',
    status: 'Confirmado',
  },
  {
    id: 'mv-102',
    type: 'in',
    product: 'Guantes anticorte',
    reference: 'Pedido Segurimax',
    category: 'EPP',
    quantity: 40,
    unit: 'pares',
    origin: 'Segurimax S.A.',
    date: '2025-06-16 08:20',
    user: 'Luis P.',
    status: 'Confirmado',
  },
  {
    id: 'mv-103',
    type: 'adjustment',
    product: 'Botiquín de primeros auxilios',
    reference: 'Ajuste por revisión',
    category: 'Botiquines',
    quantity: 2,
    unit: 'unidades',
    origin: 'Almacén principal',
    date: '2025-06-15 17:10',
    user: 'Ana M.',
    status: 'Revisión',
  },
  {
    id: 'mv-104',
    type: 'out',
    product: 'Señal salida de emergencia',
    reference: 'Entrega por obra',
    category: 'Señalización',
    quantity: 12,
    unit: 'unidades',
    origin: 'Planta Industrial Sur',
    date: '2025-06-15 11:00',
    user: 'Carlos G.',
    status: 'Pendiente',
  },
  {
    id: 'mv-105',
    type: 'in',
    product: 'Casco de seguridad',
    reference: 'Compra directa',
    category: 'EPP',
    quantity: 18,
    unit: 'unidades',
    origin: 'Protección Plus',
    date: '2025-06-14 15:30',
    user: 'María R.',
    status: 'Confirmado',
  },
]

export type Supplier = {
  id: string
  name: string
  category: string
  contact: string
  phone: string
  email: string
  rating: number
  lastDelivery: string
  nextDelivery: string
  products: string[]
  activeOrders: number
  status: 'Activo' | 'En revisión'
}

export const suppliers: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Segurimax S.A.',
    category: 'EPP / seguridad',
    contact: 'Laura Fernández',
    phone: '+56 9 4567 8890',
    email: 'ventas@segurimax.cl',
    rating: 4.9,
    lastDelivery: '12 jun 2025',
    nextDelivery: '18 jun 2025',
    products: ['Guantes anticorte', 'Casco de seguridad', 'Botiquines'],
    activeOrders: 2,
    status: 'Activo',
  },
  {
    id: 'sup-002',
    name: 'Protección Plus',
    category: 'Extintores',
    contact: 'Javier Márquez',
    phone: '+56 9 3321 4554',
    email: 'javier@proteccionplus.cl',
    rating: 4.7,
    lastDelivery: '09 jun 2025',
    nextDelivery: '21 jun 2025',
    products: ['Extintores ABC', 'Extintores CO2', 'Mangueras'],
    activeOrders: 1,
    status: 'Activo',
  },
  {
    id: 'sup-003',
    name: 'Señales Norte',
    category: 'Señalización',
    contact: 'Patricia Solís',
    phone: '+56 9 2100 5587',
    email: 'contacto@senalesnorte.cl',
    rating: 4.5,
    lastDelivery: '04 jun 2025',
    nextDelivery: '24 jun 2025',
    products: ['Señales de salida', 'Cintas de seguridad', 'Rótulos'],
    activeOrders: 3,
    status: 'En revisión',
  },
]

export type ServiceRecord = {
  id: string
  title: string
  client: string
  location: string
  date: string
  time: string
  type: 'Prevención' | 'Mantenimiento' | 'Capacitación'
  status: 'Programado' | 'En curso' | 'Pendiente'
  assignedTo: string
  notes: string
}

export const services: ServiceRecord[] = [
  {
    id: 'srv-001',
    title: 'Capacitación brigada de emergencias',
    client: 'Edificio Los Robles',
    location: 'Sala de reuniones 2',
    date: '2025-06-18',
    time: '09:00',
    type: 'Capacitación',
    status: 'Programado',
    assignedTo: 'Sofía C.',
    notes: 'Incluye evacuación y uso de extintores.',
  },
  {
    id: 'srv-002',
    title: 'Inspección anual de extintores',
    client: 'Planta Industrial Sur',
    location: 'Patio exterior',
    date: '2025-06-20',
    time: '14:30',
    type: 'Mantenimiento',
    status: 'Programado',
    assignedTo: 'Jorge H.',
    notes: 'Revisión de vencimientos y recarga.',
  },
  {
    id: 'srv-003',
    title: 'Auditoría de seguridad',
    client: 'Centro Comercial Alameda',
    location: 'Niveles 1 y 2',
    date: '2025-06-22',
    time: '10:15',
    type: 'Prevención',
    status: 'Pendiente',
    assignedTo: 'Constanza V.',
    notes: 'Se revisarán rutas de evacuación y señalización.',
  },
]

export type TeamMember = {
  id: string
  name: string
  role: 'Supervisor' | 'Técnico' | 'Inspector' | 'Operador'
  department: string
  location: string
  phone: string
  email: string
  status: 'Disponible' | 'En campo' | 'Capacitación'
  shift: 'Turno A' | 'Turno B'
  rating: number
  skills: string[]
  nextAssignment: string
}

export const teamMembers: TeamMember[] = [
  {
    id: 'team-001',
    name: 'María Rodríguez',
    role: 'Supervisor',
    department: 'Seguridad operativa',
    location: 'Sede central',
    phone: '+56 9 3345 2201',
    email: 'maria.rodriguez@jesegurity.cl',
    status: 'Disponible',
    shift: 'Turno A',
    rating: 4.9,
    skills: ['Extintores', 'Emergencias', 'Auditoría'],
    nextAssignment: 'Inspección Planta Sur',
  },
  {
    id: 'team-002',
    name: 'Luis Pérez',
    role: 'Técnico',
    department: 'Mantenimiento',
    location: 'Planta Industrial Sur',
    phone: '+56 9 4421 8770',
    email: 'luis.perez@jesegurity.cl',
    status: 'En campo',
    shift: 'Turno B',
    rating: 4.8,
    skills: ['Recargas', 'Monitoreo', 'EPP'],
    nextAssignment: 'Revisión de extintores',
  },
  {
    id: 'team-003',
    name: 'Ana Morales',
    role: 'Inspector',
    department: 'Prevención',
    location: 'Obra Centro Norte',
    phone: '+56 9 2887 1109',
    email: 'ana.morales@jesegurity.cl',
    status: 'Disponible',
    shift: 'Turno A',
    rating: 4.7,
    skills: ['Inspección', 'Señalización', 'Riesgos'],
    nextAssignment: 'Control de seguridad',
  },
  {
    id: 'team-004',
    name: 'Carlos Guzmán',
    role: 'Operador',
    department: 'Campo',
    location: 'Edificio Los Robles',
    phone: '+56 9 3901 4413',
    email: 'carlos.guzman@jesegurity.cl',
    status: 'Capacitación',
    shift: 'Turno B',
    rating: 4.6,
    skills: ['Evacuación', 'Primeros auxilios', 'Patrullaje'],
    nextAssignment: 'Capacitación brigada',
  },
]
