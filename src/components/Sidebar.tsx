import {
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  Gauge,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'

type Section = 'Inicio' | 'Inventario' | 'Movimientos' | 'Proveedores' | 'Servicios' | 'Equipo'

type SidebarProps = {
  activeSection: Section
  onSectionChange: (section: Section) => void
  onLogout?: () => void
}

const navigation = [
  { label: 'Inicio', icon: Gauge },
  { label: 'Inventario', icon: Boxes, badge: '3' },
  { label: 'Movimientos', icon: ClipboardList },
  { label: 'Proveedores', icon: Truck },
  { label: 'Servicios', icon: FileText },
  { label: 'Equipo', icon: Users },
] as const

export function Sidebar({ activeSection, onSectionChange, onLogout }: SidebarProps) {
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
          {navigation.map((item) => {
            const { label, icon: Icon } = item
            const badge = 'badge' in item ? item.badge : undefined
            return (
            <button
              className={`nav-item ${activeSection === label ? 'active' : ''}`}
              key={label}
              onClick={() => onSectionChange(label)}
              type="button"
            >
              <Icon size={18} />
              <span>{label}</span>
              {badge && <span className="nav-badge">{badge}</span>}
            </button>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="nav-item" type="button"><Bell size={18} /><span>Notificaciones</span><span className="notification-dot" /></button>
        <button className="nav-item" type="button"><Settings size={18} /><span>Configuración</span></button>
        <button className="nav-item" type="button"><HelpCircle size={18} /><span>Centro de ayuda</span></button>
        <button className="profile-row logout-row" type="button" onClick={onLogout}>
          <div className="profile-avatar">MR</div>
          <div><strong>María Rodríguez</strong><span>Administradora</span></div>
          <LogOut size={16} className="logout-icon" />
        </button>
      </div>
    </aside>
  )
}

export type { Section }
