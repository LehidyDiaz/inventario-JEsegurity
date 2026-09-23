import { Bell, ChevronDown, LockKeyhole, Menu, Search, ShieldCheck, ArrowUp } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import './App.css'
import { Dashboard } from './components/Dashboard'
import { InventoryTable } from './components/InventoryTable'
import { MovementsPanel } from './components/MovementsPanel'
import { ServicesPanel } from './components/ServicesPanel'
import { Sidebar, type Section } from './components/Sidebar'
import { SettingsPanel } from './components/SettingsPanel'
import { SuppliersPanel } from './components/SuppliersPanel'
import { TeamPanel } from './components/TeamPanel'
import { login, logout, type AuthUser } from './lib/authApi'

function App() {
  const [activeSection, setActiveSection] = useState<Section>('Inicio')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const user = await login(credentials.email.trim().toLowerCase(), credentials.password)
      setCurrentUser(user)
      setIsAuthenticated(true)
      setLoginError('')
      setActiveSection('Inicio')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCredentials({ email: '', password: '' })
    setLoginError('')
    setActiveSection('Inicio')
    setCurrentUser(null)
    logout()
  }

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-mark"><ShieldCheck size={22} strokeWidth={2.3} /></div>
            <div>
              <strong>JESegurity</strong>
              <span>Gestión operativa</span>
            </div>
          </div>

          <div className="login-header">
            <div className="login-icon"><LockKeyhole size={22} /></div>
            <h1>Acceso al sistema</h1>
            <p>Ingresa tus credenciales para continuar con la supervisión del inventario y operaciones.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              <span>Correo electrónico</span>
              <input
                type="email"
                value={credentials.email}
                onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                placeholder="admin@jesegurity.com"
                autoComplete="email"
              />
            </label>

            <label>
              <span>Contraseña</span>
              <input
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                placeholder="••••••"
                autoComplete="current-password"
              />
            </label>

            {loginError && <p className="login-error">{loginError}</p>}

            <button className="primary-button login-button" type="submit">Entrar al sistema</button>
          </form>

          <div className="demo-credentials">
            <span>Credenciales demo</span>
            <strong>admin@jesegurity.com</strong>
            <small>123456</small>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className={`mobile-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={sidebarOpen ? 'sidebar-mobile-open' : ''}>
        <Sidebar
          activeSection={activeSection}
          onSectionChange={(section) => { setActiveSection(section); setSidebarOpen(false) }}
          onLogout={handleLogout}
          isAdmin={currentUser?.role === 'Administrador'}
        />
      </div>
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" type="button" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Menu size={20} /></button>
          <div className="breadcrumb"><span>JESegurity</span><ChevronDown size={14} /><strong>{activeSection}</strong></div>
          <div className="topbar-actions"><div className="global-search"><Search size={17} /><input placeholder="Buscar en el sistema..." aria-label="Buscar en el sistema" /><kbd>⌘ K</kbd></div><button className="topbar-icon" type="button" aria-label="Notificaciones"><Bell size={19} /><i /></button><div className="topbar-profile"><div className="profile-avatar small">MR</div><span>María Rodríguez</span><ChevronDown size={14} /></div></div>
        </header>
        {activeSection === 'Inicio' ? <Dashboard onOpenInventory={() => setActiveSection('Inventario')} /> : activeSection === 'Inventario' ? <InventoryTable canManageProducts={currentUser?.role === 'Administrador' || currentUser?.role === 'Supervisor'} /> : activeSection === 'Movimientos' ? <MovementsPanel /> : activeSection === 'Proveedores' ? <SuppliersPanel /> : activeSection === 'Servicios' ? <ServicesPanel /> : activeSection === 'Equipo' ? <TeamPanel /> : activeSection === 'Configuración' ? <SettingsPanel /> : <section className="coming-soon"><div className="coming-soon-icon"><Menu size={24} /></div><p className="eyebrow">Módulo en preparación</p><h1>{activeSection}</h1><p>Este espacio está listo para conectar sus procesos operativos.</p><button className="secondary-button" type="button" onClick={() => setActiveSection('Inicio')}>Volver al inicio</button></section>}
        <button className="scroll-top-button" type="button" onClick={scrollToTop} aria-label="Subir arriba">
          <ArrowUp size={18} />
        </button>
      </main>
    </div>
  )
}

export default App
