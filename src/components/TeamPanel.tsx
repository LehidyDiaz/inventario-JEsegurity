import { Mail, MapPin, Phone, Search, ShieldCheck, Star, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { teamMembers } from '../types/inventory'

export function TeamPanel() {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesQuery = `${member.name} ${member.role} ${member.department} ${member.location}`
        .toLowerCase()
        .includes(query.toLowerCase())
      const matchesRole = roleFilter === 'Todos' || member.role === roleFilter
      return matchesQuery && matchesRole
    })
  }, [query, roleFilter])

  const summary = useMemo(() => {
    const onSite = teamMembers.filter((member) => member.status === 'En campo').length
    const available = teamMembers.filter((member) => member.status === 'Disponible').length
    const training = teamMembers.filter((member) => member.status === 'Capacitación').length
    const active = teamMembers.filter((member) => member.shift === 'Turno A').length

    return { onSite, available, training, active }
  }, [])

  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Equipo</p>
          <h1>Personal operativo</h1>
          <p className="intro">Supervisión del personal, disponibilidad y asignación de turnos.</p>
        </div>
        <button className="primary-button" type="button">Agregar miembro</button>
      </section>

      <div className="module-summary">
        <div>
          <strong>{teamMembers.length}</strong>
          <span>Personal total</span>
        </div>
        <div>
          <strong className="green-text">{summary.available}</strong>
          <span>Disponibles</span>
        </div>
        <div>
          <strong className="amber-text">{summary.onSite}</strong>
          <span>En campo</span>
        </div>
        <div>
          <strong className="red-text">{summary.training}</strong>
          <span>Capacitación</span>
        </div>
      </div>

      <section className="panel inventory-panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empleado o área..." />
          </div>

          <div className="toolbar-actions">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filtrar por cargo">
              <option value="Todos">Todos</option>
              <option value="Supervisor">Supervisores</option>
              <option value="Técnico">Técnicos</option>
              <option value="Inspector">Inspectores</option>
              <option value="Operador">Operadores</option>
            </select>
            <button className="secondary-button" type="button"><Users size={16} /> Ver equipo</button>
          </div>
        </div>

        <div className="team-grid">
          {filteredMembers.map((member) => (
            <article className="team-card" key={member.id}>
              <div className="team-card-head">
                <div className="team-avatar">{member.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</div>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>
                <span className={`status-pill ${member.status === 'Disponible' ? 'status-ok' : member.status === 'En campo' ? 'status-low' : 'status-empty'}`}><i />{member.status}</span>
              </div>

              <div className="team-meta-row">
                <div>
                  <small>Departamento</small>
                  <strong>{member.department}</strong>
                </div>
                <div className="rating-box">
                  <Star size={12} fill="currentColor" />
                  {member.rating.toFixed(1)}
                </div>
              </div>

              <div className="team-details">
                <div><MapPin size={14} /> {member.location}</div>
                <div><ShieldCheck size={14} /> Turno {member.shift}</div>
                <div><Phone size={14} /> {member.phone}</div>
                <div><Mail size={14} /> {member.email}</div>
              </div>

              <div className="team-skills">
                {member.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>

              <div className="team-footer">
                <span>Próxima asignación: {member.nextAssignment}</span>
                <button type="button">Perfil</button>
              </div>
            </article>
          ))}
        </div>

        {filteredMembers.length === 0 && <div className="empty-state">No se encontró personal con ese criterio.</div>}

        <div className="table-footer">
          <span>Mostrando {filteredMembers.length} de {teamMembers.length} colaboradores</span>
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
