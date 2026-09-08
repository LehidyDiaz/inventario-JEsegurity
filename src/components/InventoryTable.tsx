import { Download, Filter, MoreHorizontal, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { inventoryItems } from '../types/inventory'

export function InventoryTable() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const categories = ['Todos', 'Extintores', 'EPP', 'Señalización']
  const filteredItems = useMemo(() => inventoryItems.filter((item) => {
    const matchesQuery = `${item.name} ${item.sku}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === 'Todos' || item.category === category)
  }), [category, query])

  return <div className="inventory-view">
    <section className="page-heading"><div><p className="eyebrow">Gestión de recursos</p><h1>Inventario</h1><p className="intro">Controla materiales, equipos y elementos de protección.</p></div><button className="primary-button" type="button"><Plus size={17} /> Nuevo producto</button></section>
    <div className="inventory-summary"><div><strong>1.284</strong><span>Productos registrados</span></div><div><strong className="green-text">1.212</strong><span>En stock</span></div><div><strong className="amber-text">69</strong><span>Stock bajo</span></div><div><strong className="red-text">3</strong><span>Agotados</span></div></div>
    <section className="panel inventory-panel"><div className="table-toolbar"><div className="search-input"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o SKU..." /></div><div className="toolbar-actions"><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoría">{categories.map((item) => <option key={item}>{item}</option>)}</select><button className="secondary-button" type="button"><Filter size={16} /> Más filtros</button><button className="icon-button" type="button" aria-label="Exportar inventario"><Download size={17} /></button><button className="icon-button" type="button" aria-label="Configurar columnas"><SlidersHorizontal size={17} /></button></div></div>
      <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Categoría</th><th>SKU</th><th>Existencias</th><th>Ubicación</th><th>Estado</th><th>Actualizado</th><th aria-label="Acciones" /></tr></thead><tbody>{filteredItems.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><span className="cell-subtitle">{item.unit}</span></td><td>{item.category}</td><td className="sku">{item.sku}</td><td><strong>{item.quantity}</strong><span className="cell-subtitle">Mín. {item.minimum}</span></td><td>{item.location}</td><td><span className={`status-pill ${item.status === 'En stock' ? 'status-ok' : item.status === 'Stock bajo' ? 'status-low' : 'status-empty'}`}><i />{item.status}</span></td><td className="muted-cell">{item.updatedAt}</td><td><button className="icon-button small" type="button" aria-label={`Más acciones para ${item.name}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>{filteredItems.length === 0 && <div className="empty-state">No encontramos productos con esos filtros.</div>}</div><div className="table-footer"><span>Mostrando {filteredItems.length} de 1.284 productos</span><div><button className="pagination-button" type="button">Anterior</button><button className="pagination-button active" type="button">1</button><button className="pagination-button" type="button">2</button><button className="pagination-button" type="button">3</button><button className="pagination-button" type="button">Siguiente</button></div></div></section>
  </div>
}
