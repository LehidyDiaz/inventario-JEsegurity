import { Building2, Mail, Phone, Search, Star, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { suppliers } from '../types/inventory'

export function SuppliersPanel() {
  const [query, setQuery] = useState('')

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const hayCoincidencia = `${supplier.name} ${supplier.category} ${supplier.contact}`.toLowerCase().includes(query.toLowerCase())
      return hayCoincidencia
    })
  }, [query])

  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Proveedores</p>
          <h1>Proveedores y compras</h1>
          <p className="intro">Seguimiento de vendedores, entregas y coordinación operativa.</p>
        </div>
        <button className="primary-button" type="button">Nuevo proveedor</button>
      </section>

      <div className="module-summary">
        <div>
          <strong>{suppliers.length}</strong>
          <span>Contactos activos</span>
        </div>
        <div>
          <strong className="green-text">{suppliers.filter((supplier) => supplier.status === 'Activo').length}</strong>
          <span>Activos</span>
        </div>
        <div>
          <strong className="amber-text">{suppliers.reduce((sum, supplier) => sum + supplier.activeOrders, 0)}</strong>
          <span>Pedidos vigentes</span>
        </div>
        <div>
          <strong className="red-text">{suppliers.filter((supplier) => supplier.status === 'En revisión').length}</strong>
          <span>En revisión</span>
        </div>
      </div>

      <section className="panel inventory-panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar proveedor o contacto..." />
          </div>
          <button className="secondary-button" type="button"><Truck size={16} /> Ver entregas</button>
        </div>

        <div className="supplier-grid">
          {filteredSuppliers.map((supplier) => (
            <article className="supplier-card" key={supplier.id}>
              <div className="supplier-card-head">
                <div className="brand-badge"><Building2 size={18} /></div>
                <div>
                  <strong>{supplier.name}</strong>
                  <span>{supplier.category}</span>
                </div>
                <span className={`status-pill ${supplier.status === 'Activo' ? 'status-ok' : 'status-low'}`}><i />{supplier.status}</span>
              </div>

              <div className="supplier-meta-row">
                <div>
                  <small>Contacto</small>
                  <strong>{supplier.contact}</strong>
                </div>
                <div className="rating-box">
                  <Star size={12} fill="currentColor" />
                  {supplier.rating.toFixed(1)}
                </div>
              </div>

              <div className="supplier-contact-list">
                <div><Phone size={14} /> {supplier.phone}</div>
                <div><Mail size={14} /> {supplier.email}</div>
              </div>

              <div className="supplier-product-list">
                {supplier.products.map((product) => <span key={product}>{product}</span>)}
              </div>

              <div className="supplier-delivery-grid">
                <div>
                  <small>Última entrega</small>
                  <strong>{supplier.lastDelivery}</strong>
                </div>
                <div>
                  <small>Próxima</small>
                  <strong>{supplier.nextDelivery}</strong>
                </div>
              </div>

              <div className="supplier-footer">
                <span>{supplier.activeOrders} pedidos activos</span>
                <button type="button">Ver detalle</button>
              </div>
            </article>
          ))}
        </div>

        {filteredSuppliers.length === 0 && <div className="empty-state">No se encontraron proveedores con ese criterio.</div>}

        <div className="table-footer">
          <span>Mostrando {filteredSuppliers.length} de {suppliers.length} proveedores</span>
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
