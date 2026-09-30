import {
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  CalendarClock,
  Gauge,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  ShoppingCart,
  BarChart3,
  History,
} from 'lucide-react'
import type { AuthUser } from '../types/inventory'

type Section = 'Inicio' | 'Inventario' | 'Movimientos' | 'Proveedores' | 'Servicios' | 'Compras' | 'Vencimientos' | 'Reportes' | 'Auditoría' | 'Equipo' | 'Configuración'

type SidebarProps = {
  activeSection: Section
  onSectionChange: (section: Section) => void
  onLogout?: () => void
  isAdmin?: boolean
  canSupervise?: boolean
  unreadCount?: number
  onNotifications?: () => void
  onHelp?: () => void
  onProfile?: () => void
  currentUser: AuthUser
}

const navigation = [
  { label: 'Inicio', icon: Gauge },
  { label: 'Inventario', icon: Boxes },
  { label: 'Movimientos', icon: ClipboardList },
  { label: 'Proveedores', icon: Truck },
  { label: 'Servicios', icon: FileText },
  { label: 'Vencimientos', icon: CalendarClock },
  { label: 'Equipo', icon: Users },
] as const

const initials = (name: string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

export function Sidebar({ activeSection, onSectionChange, onLogout, isAdmin = false, canSupervise = false, unreadCount = 0, onNotifications, onHelp, onProfile, currentUser }: SidebarProps) {
  const items = [...navigation.filter((item)=>item.label!=='Equipo'||isAdmin), ...(canSupervise ? [{label:'Compras' as const,icon:ShoppingCart},{label:'Reportes' as const,icon:BarChart3},{label:'Auditoría' as const,icon:History}] : [])]
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={22} strokeWidth={2.3} /></div>
          <div>
            <strong>JESegurity</strong>
            <span>Gestión operativa</span>
          </div>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">JP</div>
          <div>
            <strong>JESegurity Prevención</strong>
            <span>Cuenta principal</span>
          </div>
          <span className="chevron">⌄</span>
        </div>

        <nav className="main-nav" aria-label="Navegación principal">
          <p className="nav-heading">Espacio de trabajo</p>
          {items.map((item) => {
            const { label, icon: Icon } = item
            return (
            <button
              className={`nav-item ${activeSection === label ? 'active' : ''}`}
              key={label}
              onClick={() => onSectionChange(label)}
              type="button"
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="nav-item" type="button" onClick={onNotifications}><Bell size={18} /><span>Notificaciones</span>{unreadCount>0&&<span className="nav-badge">{unreadCount>99?'99+':unreadCount}</span>}</button>
        {isAdmin && <button className={`nav-item ${activeSection === 'Configuración' ? 'active' : ''}`} type="button" onClick={() => onSectionChange('Configuración')}><Settings size={18} /><span>Configuración</span></button>}
        <button className="nav-item" type="button" onClick={onHelp}><HelpCircle size={18} /><span>Centro de ayuda</span></button>
        <button className="profile-row" type="button" onClick={onProfile}>
          <div className="profile-avatar">{initials(currentUser.name)}</div><div><strong>{currentUser.name}</strong><span>{currentUser.role}</span></div>
        </button>
        <button className="profile-row logout-row" type="button" onClick={onLogout}>
          <div><strong>Cerrar sesión</strong><span>Salir de forma segura</span></div>
          <LogOut size={16} className="logout-icon" />
        </button>
      </div>
    </aside>
  )
}

export type { Section }
