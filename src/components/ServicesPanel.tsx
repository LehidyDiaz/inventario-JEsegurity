import { CalendarDays, Clock3, MapPin, Search, ShieldCheck, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { services } from '../types/inventory'

export function ServicesPanel() {
  const [query, setQuery] = useState('')

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matches = `${service.title} ${service.client} ${service.location}`.toLowerCase().includes(query.toLowerCase())
      return matches
    })
  }, [query])

  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Servicios</p>
          <h1>Agenda y mantenimiento</h1>
          <p className="intro">Programación de inspecciones, capacitaciones y revisiones de seguridad.</p>
        </div>
        <button className="primary-button" type="button">Nuevo servicio</button>
      </section>

      <div className="module-summary">
        <div>
          <strong>{services.length}</strong>
          <span>Servicios</span>
        </div>
        <div>
          <strong className="green-text">{services.filter((service) => service.status === 'Programado').length}</strong>
          <span>Programados</span>
        </div>
        <div>
          <strong className="amber-text">{services.filter((service) => service.status === 'En curso').length}</strong>
          <span>En curso</span>
        </div>
        <div>
          <strong className="red-text">{services.filter((service) => service.status === 'Pendiente').length}</strong>
          <span>Pendientes</span>
        </div>
      </div>

      <section className="panel inventory-panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar servicio, cliente o lugar..." />
          </div>
          <button className="secondary-button" type="button"><CalendarDays size={16} /> Ver calendario</button>
        </div>

        <div className="service-detailed-list">
          {filteredServices.map((service) => (
            <article className="service-card" key={service.id}>
              <div className="service-date-box">
                <strong>{new Date(service.date).getDate()}</strong>
                <span>{new Date(service.date).toLocaleDateString('es-CL', { month: 'short' }).replace('.', '').toUpperCase()}</span>
              </div>

              <div className="service-card-content">
                <div className="service-header-row">
                  <div>
                    <strong>{service.title}</strong>
                    <span>{service.type}</span>
                  </div>
                  <span className={`status-pill ${service.status === 'Programado' ? 'status-ok' : service.status === 'En curso' ? 'status-low' : 'status-empty'}`}><i />{service.status}</span>
                </div>

                <div className="service-meta">
                  <div><ShieldCheck size={14} /> {service.client}</div>
                  <div><MapPin size={14} /> {service.location}</div>
                  <div><Clock3 size={14} /> {service.time}</div>
                  <div><UserRound size={14} /> {service.assignedTo}</div>
                </div>

                <p>{service.notes}</p>
              </div>
            </article>
          ))}
        </div>

        {filteredServices.length === 0 && <div className="empty-state">No se encontraron servicios con ese criterio.</div>}

        <div className="table-footer">
          <span>Mostrando {filteredServices.length} de {services.length} servicios</span>
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
