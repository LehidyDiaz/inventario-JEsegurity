import { Bell, ChevronDown, LockKeyhole, Menu, Search, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import './App.css'
import { Dashboard } from './components/Dashboard'
import { InventoryTable } from './components/InventoryTable'
import { Sidebar, type Section } from './components/Sidebar'

const DEMO_USER = {
  email: 'admin@jesegurity.com',
  password: '123456',
}

function App() {
  const [activeSection, setActiveSection] = useState<Section>('Inicio')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      credentials.email.trim().toLowerCase() === DEMO_USER.email &&
      credentials.password === DEMO_USER.password
    ) {
      setIsAuthenticated(true)
      setLoginError('')
      setActiveSection('Inicio')
      return
    }

    setLoginError('Credenciales incorrectas. Usa admin@jesegurity.com / 123456.')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCredentials({ email: '', password: '' })
    setLoginError('')
    setActiveSection('Inicio')
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
        />
      </div>
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" type="button" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Menu size={20} /></button>
          <div className="breadcrumb"><span>JESegurity</span><ChevronDown size={14} /><strong>{activeSection}</strong></div>
          <div className="topbar-actions"><div className="global-search"><Search size={17} /><input placeholder="Buscar en el sistema..." aria-label="Buscar en el sistema" /><kbd>⌘ K</kbd></div><button className="topbar-icon" type="button" aria-label="Notificaciones"><Bell size={19} /><i /></button><div className="topbar-profile"><div className="profile-avatar small">MR</div><span>María Rodríguez</span><ChevronDown size={14} /></div></div>
        </header>
        {activeSection === 'Inicio' ? <Dashboard onOpenInventory={() => setActiveSection('Inventario')} /> : activeSection === 'Inventario' ? <InventoryTable /> : <section className="coming-soon"><div className="coming-soon-icon"><Menu size={24} /></div><p className="eyebrow">Módulo en preparación</p><h1>{activeSection}</h1><p>Este espacio está listo para conectar sus procesos operativos.</p><button className="secondary-button" type="button" onClick={() => setActiveSection('Inicio')}>Volver al inicio</button></section>}
      </main>
    </div>
  )
}

export default App
