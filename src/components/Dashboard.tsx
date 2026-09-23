import { ArrowDownLeft, ArrowUpRight, Boxes, CalendarDays, ChevronRight, CircleAlert, PackageCheck, Plus, ShieldAlert, Truck } from 'lucide-react'
import { recentMovements } from '../types/inventory'
import { getProducts } from '../lib/inventoryApi'
import { useEffect, useState } from 'react'

type DashboardProps = {
  onOpenInventory: () => void
}

export function Dashboard({ onOpenInventory }: DashboardProps) {
  const [inventoryValue, setInventoryValue] = useState(0)

  useEffect(() => {
    getProducts().then((products) => {
      setInventoryValue(products.reduce((total, product) => total + product.quantity * (product.purchasePrice ?? 0), 0))
    }).catch(() => setInventoryValue(0))
  }, [])

  const formattedInventoryValue = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(inventoryValue)

  return (
    <div className="dashboard-view">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">Lunes, 16 de junio de 2025</p>
          <h1>Buenos días, María <span>✦</span></h1>
          <p className="intro">Aquí tienes el estado operativo de JESegurity para hoy.</p>
        </div>
        <button className="primary-button" type="button" onClick={onOpenInventory}><Plus size={17} /> Registrar movimiento</button>
      </section>

      <section className="metric-grid" aria-label="Resumen del inventario">
        <article className="metric-card accent-card">
          <div className="metric-top"><span>Valor del inventario</span><span className="metric-icon mint"><Boxes size={17} /></span></div>
          <strong>$ {formattedInventoryValue}</strong>
          <div className="metric-foot"><span className="trend positive"><ArrowUpRight size={14} /> 8,2%</span><span>vs. mes anterior</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Ítems en inventario</span><span className="metric-icon blue"><PackageCheck size={17} /></span></div>
          <strong>1.284</strong>
          <div className="metric-foot"><span className="trend positive"><ArrowUpRight size={14} /> 12,4%</span><span>vs. mes anterior</span></div>
        </article>
        <article className="metric-card warning-card">
          <div className="metric-top"><span>Stock bajo</span><span className="metric-icon amber"><CircleAlert size={17} /></span></div>
          <strong>3</strong>
          <div className="metric-foot"><span className="trend warning">Requiere atención</span><button onClick={onOpenInventory} type="button">Ver alertas <ChevronRight size={13} /></button></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Servicios este mes</span><span className="metric-icon coral"><ShieldAlert size={17} /></span></div>
          <strong>28</strong>
          <div className="metric-foot"><span className="trend positive"><ArrowUpRight size={14} /> 5,6%</span><span>vs. mes anterior</span></div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel chart-panel">
          <div className="panel-heading"><div><h2>Actividad de inventario</h2><p>Entradas y salidas de los últimos 7 días</p></div><button className="period-button" type="button">Esta semana <ChevronRight size={14} /></button></div>
          <div className="chart-legend"><span><i className="legend-dot green" /> Entradas</span><span><i className="legend-dot orange" /> Salidas</span></div>
          <div className="chart-area">
            <div className="y-axis"><span>120</span><span>80</span><span>40</span><span>0</span></div>
            <div className="chart-body">
              <div className="grid-line line-1" /><div className="grid-line line-2" /><div className="grid-line line-3" /><div className="grid-line line-4" />
              <div className="bars">
                {[['Lun', 52, 35], ['Mar', 72, 48], ['Mié', 40, 32], ['Jue', 88, 60], ['Vie', 62, 42], ['Sáb', 32, 20], ['Dom', 25, 14]].map(([day, inValue, outValue]) => <div className="bar-group" key={day}><div className="bar-pair"><i className="bar entry" style={{ height: `${inValue}%` }} /><i className="bar exit" style={{ height: `${outValue}%` }} /></div><span>{day}</span></div>)}
              </div>
            </div>
          </div>
        </article>

        <article className="panel alert-panel">
          <div className="panel-heading"><div><h2>Alertas de stock</h2><p>Productos que necesitan atención</p></div><button className="text-button" type="button" onClick={onOpenInventory}>Ver todo <ChevronRight size={14} /></button></div>
          <div className="alert-list">
            <div className="alert-item"><div className="alert-symbol red"><CircleAlert size={17} /></div><div><strong>Extintor CO2 5 kg</strong><span>Quedan 8 · Mínimo 12</span></div><button type="button">Reponer</button></div>
            <div className="alert-item"><div className="alert-symbol amber"><CircleAlert size={17} /></div><div><strong>Casco de seguridad blanco</strong><span>Quedan 5 · Mínimo 12</span></div><button type="button">Reponer</button></div>
            <div className="alert-item"><div className="alert-symbol amber"><CircleAlert size={17} /></div><div><strong>Botiquín primeros auxilios</strong><span>Quedan 2 · Mínimo 5</span></div><button type="button">Reponer</button></div>
          </div>
        </article>
      </section>

      <section className="content-grid lower-grid">
        <article className="panel movements-panel">
          <div className="panel-heading"><div><h2>Movimientos recientes</h2><p>Últimas operaciones registradas</p></div><button className="text-button" type="button">Ver historial <ChevronRight size={14} /></button></div>
          <div className="movement-list">{recentMovements.map((movement) => <div className="movement-item" key={movement.title}><div className={`movement-symbol ${movement.type}`}>{movement.type === 'in' ? <ArrowDownLeft size={17} /> : movement.type === 'out' ? <ArrowUpRight size={17} /> : <Boxes size={17} />}</div><div><strong>{movement.title}</strong><span>{movement.detail}</span></div><time>{movement.time}</time></div>)}</div>
        </article>
        <article className="panel services-panel">
          <div className="panel-heading"><div><h2>Próximos servicios</h2><p>Planificación de esta semana</p></div><CalendarDays size={18} className="muted-icon" /></div>
          <div className="service-list"><div className="service-item"><div className="date-tile"><strong>18</strong><span>JUN</span></div><div><strong>Capacitación brigada</strong><span>Edificio Los Robles · 09:00</span></div><Truck size={16} /></div><div className="service-item"><div className="date-tile"><strong>20</strong><span>JUN</span></div><div><strong>Inspección de extintores</strong><span>Planta Industrial Sur · 14:30</span></div><Truck size={16} /></div></div>
        </article>
      </section>
    </div>
  )
}
