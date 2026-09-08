import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
import { useState } from 'react'
import './App.css'
import { Dashboard } from './components/Dashboard'
import { InventoryTable } from './components/InventoryTable'
import { Sidebar, type Section } from './components/Sidebar'

function App() {
  const [activeSection, setActiveSection] = useState<Section>('Inicio')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <div className={`mobile-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={sidebarOpen ? 'sidebar-mobile-open' : ''}>
        <Sidebar activeSection={activeSection} onSectionChange={(section) => { setActiveSection(section); setSidebarOpen(false) }} />
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
