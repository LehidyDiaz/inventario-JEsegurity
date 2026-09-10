import { ArrowDownLeft, ArrowUpRight, Boxes, Download, Filter, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { movements } from '../types/inventory'

const movementTypeConfig = {
  in: { label: 'Entradas', icon: ArrowDownLeft, className: 'type-in' },
  out: { label: 'Salidas', icon: ArrowUpRight, className: 'type-out' },
  adjustment: { label: 'Ajustes', icon: Boxes, className: 'type-adjustment' },
} as const

export function MovementsPanel() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('Todos')

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const matchesQuery = `${movement.product} ${movement.reference} ${movement.origin}`.toLowerCase().includes(query.toLowerCase())
      const matchesType = typeFilter === 'Todos' || movement.type === typeFilter
      return matchesQuery && matchesType
    })
  }, [query, typeFilter])

  const summary = useMemo(() => {
    const totalIn = movements.filter((m) => m.type === 'in').length
    const totalOut = movements.filter((m) => m.type === 'out').length
    const pending = movements.filter((m) => m.status === 'Pendiente').length
    const reviewed = movements.filter((m) => m.status === 'Revisión').length

    return { totalIn, totalOut, pending, reviewed }
  }, [])

  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Operación</p>
          <h1>Movimientos</h1>
          <p className="intro">Control de entradas, salidas y ajustes del inventario.</p>
        </div>
        <button className="primary-button" type="button">Registrar movimiento</button>
      </section>

      <div className="module-summary">
        <div>
          <strong>{summary.totalIn}</strong>
          <span>Entradas</span>
        </div>
        <div>
          <strong className="green-text">{summary.totalOut}</strong>
          <span>Salidas</span>
        </div>
        <div>
          <strong className="amber-text">{summary.pending}</strong>
          <span>Pendientes</span>
        </div>
        <div>
          <strong className="red-text">{summary.reviewed}</strong>
          <span>En revisión</span>
        </div>
      </div>

      <section className="panel inventory-panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar movimiento, producto o origen..." />
          </div>

          <div className="toolbar-actions">
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filtrar por tipo de movimiento">
              <option value="Todos">Todos</option>
              <option value="in">Entradas</option>
              <option value="out">Salidas</option>
              <option value="adjustment">Ajustes</option>
            </select>
            <button className="secondary-button" type="button"><Filter size={16} /> Más filtros</button>
            <button className="icon-button" type="button" aria-label="Exportar movimientos"><Download size={17} /></button>
            <button className="icon-button" type="button" aria-label="Configurar columnas"><SlidersHorizontal size={17} /></button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Referencia</th>
                <th>Cantidad</th>
                <th>Origen</th>
                <th>Fecha</th>
                <th>Responsable</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => {
                const config = movementTypeConfig[movement.type]
                const Icon = config.icon

                return (
                  <tr key={movement.id}>
                    <td>
                      <span className={`status-pill movement-type ${config.className}`}>
                        <Icon size={12} />
                        {config.label}
                      </span>
                    </td>
                    <td>
                      <strong>{movement.product}</strong>
                      <span className="cell-subtitle">{movement.category}</span>
                    </td>
                    <td>{movement.reference}</td>
                    <td>
                      <strong>{movement.quantity}</strong>
                      <span className="cell-subtitle">{movement.unit}</span>
                    </td>
                    <td>{movement.origin}</td>
                    <td className="muted-cell">{movement.date}</td>
                    <td>{movement.user}</td>
                    <td>
                      <span className={`status-pill ${movement.status === 'Confirmado' ? 'status-ok' : movement.status === 'Pendiente' ? 'status-low' : 'status-empty'}`}>
                        <i />
                        {movement.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredMovements.length === 0 && <div className="empty-state">No se encontraron movimientos con esos filtros.</div>}
        </div>

        <div className="table-footer">
          <span>Mostrando {filteredMovements.length} de {movements.length} movimientos</span>
          <div>
            <button className="pagination-button" type="button">Anterior</button>
            <button className="pagination-button active" type="button">1</button>
            <button className="pagination-button" type="button">2</button>
            <button className="pagination-button" type="button">3</button>
            <button className="pagination-button" type="button">Siguiente</button>
          </div>
        </div>
      </section>
    </div>
  )
}
