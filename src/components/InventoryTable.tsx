import { Download, Filter, MoreHorizontal, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getCatalog, type CatalogItem } from '../lib/catalogApi'
import { createProduct, deleteProduct, getProducts, updateProduct } from '../lib/inventoryApi'
import { inventoryItems, type InventoryItem } from '../types/inventory'

type ProductForm = {
  name: string
  category: string
  sku: string
  purchasePrice: string
  quantity: string
  minimum: string
  unit: string
  location: string
}

const defaultProductForm: ProductForm = {
  name: '',
  category: 'Extintores',
  sku: '',
  purchasePrice: '0',
  quantity: '0',
  minimum: '0',
  unit: 'unidades',
  location: 'Almacén principal',
}

const getStatus = (quantity: number, minimum: number) => {
  if (quantity === 0) return 'Agotado'
  if (quantity <= minimum) return 'Stock bajo'
  return 'En stock'
}

export function InventoryTable({ canManageProducts = false }: { canManageProducts?: boolean }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<ProductForm>(defaultProductForm)
  const [error, setError] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<CatalogItem[]>([])
  const [locationOptions, setLocationOptions] = useState<CatalogItem[]>([])

  const categories = ['Todos', ...categoryOptions.map((item) => item.name)]
  const formCategories = categoryOptions.some((item) => item.name === formData.category) || !formData.category
    ? categoryOptions
    : [{ id: 'current-category', name: formData.category }, ...categoryOptions]
  const formLocations = locationOptions.some((item) => item.name === formData.location) || !formData.location
    ? locationOptions
    : [{ id: 'current-location', name: formData.location }, ...locationOptions]

  useEffect(() => {
    getProducts()
      .then(setItems)
      .catch((loadError: Error) => setError(loadError.message))
    Promise.all([getCatalog('categories'), getCatalog('locations')])
      .then(([nextCategories, nextLocations]) => {
        setCategoryOptions(nextCategories)
        setLocationOptions(nextLocations)
      })
      .catch((loadError: Error) => setError(loadError.message))
  }, [])

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesQuery = `${item.name} ${item.sku}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === 'Todos' || item.category === category)
  }), [category, items, query])

  const inventoryStats = useMemo(() => {
    const inStock = items.filter((item) => item.status === 'En stock').length
    const lowStock = items.filter((item) => item.status === 'Stock bajo').length
    const emptyStock = items.filter((item) => item.status === 'Agotado').length

    return {
      total: items.length,
      inStock,
      lowStock,
      emptyStock,
    }
  }, [items])

  const resetForm = () => {
    setFormData(defaultProductForm)
    setError('')
    setEditingId(null)
    setActiveMenuId(null)
  }

  const handleOpenCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      purchasePrice: String(item.purchasePrice),
      quantity: String(item.quantity),
      minimum: String(item.minimum),
      unit: item.unit,
      location: item.location,
    })
    setError('')
    setShowForm(true)
    setActiveMenuId(null)
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteProduct(id)
      setItems((current) => current.filter((item) => item.id !== id))
      setActiveMenuId(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el producto.')
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = formData.name.trim()
    const quantity = Number(formData.quantity)
    const minimum = Number(formData.minimum)
    const purchasePrice = Number(formData.purchasePrice)

    if (!name) {
      setError('El nombre del producto es obligatorio.')
      return
    }

    if (Number.isNaN(quantity) || Number.isNaN(minimum) || Number.isNaN(purchasePrice) || quantity < 0 || minimum < 0 || purchasePrice < 0) {
      setError('El precio, la cantidad y el mínimo deben ser números válidos.')
      return
    }

    const product = {
      name,
      category: formData.category,
      sku: formData.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      purchasePrice,
      quantity,
      minimum,
      unit: formData.unit || 'unidades',
      location: formData.location.trim() || 'Almacén principal',
    }

    try {
      if (editingId) {
        await updateProduct({ ...product, id: editingId, status: getStatus(quantity, minimum), updatedAt: 'Ahora' })
      } else {
        await createProduct(product)
      }
      setItems(await getProducts())
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el producto.')
      return
    }

    setShowForm(false)
    resetForm()
  }

  return <div className="inventory-view">
    <section className="page-heading"><div><p className="eyebrow">Gestión de recursos</p><h1>Inventario</h1><p className="intro">Controla materiales, equipos y elementos de protección.</p></div>{canManageProducts && <button className="primary-button" type="button" onClick={handleOpenCreateForm}><Plus size={17} /> Nuevo producto</button>}</section>
    <div className="inventory-summary"><div><strong>{inventoryStats.total}</strong><span>Productos registrados</span></div><div><strong className="green-text">{inventoryStats.inStock}</strong><span>En stock</span></div><div><strong className="amber-text">{inventoryStats.lowStock}</strong><span>Stock bajo</span></div><div><strong className="red-text">{inventoryStats.emptyStock}</strong><span>Agotados</span></div></div>

    {error && !showForm && <p className="form-error">{error}</p>}
    {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowForm(false); resetForm() } }}><section className="panel inventory-form-panel product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><h2 id="product-modal-title">{editingId ? 'Editar producto' : 'Agregar producto'}</h2><form className="product-form" onSubmit={handleSubmit}><div className="inline-fields"><label><span>Nombre</span><input value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Extintor ABC 6 kg" /></label><label><span>Categoría</span><select value={formData.category} onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}>{formCategories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label></div><div className="inline-fields"><label><span>SKU</span><input value={formData.sku} onChange={(event) => setFormData((current) => ({ ...current, sku: event.target.value }))} placeholder="EXT-ABC-010" /></label><label><span>Ubicación</span><select value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))}>{formLocations.map((item) => <option key={item.id}>{item.name}</option>)}</select></label></div><div className="inline-fields"><label><span>Precio de compra</span><input type="number" min="0" step="0.01" value={formData.purchasePrice} onChange={(event) => setFormData((current) => ({ ...current, purchasePrice: event.target.value }))} placeholder="0" /></label><label><span>Cantidad</span><input type="number" min="0" value={formData.quantity} onChange={(event) => setFormData((current) => ({ ...current, quantity: event.target.value }))} /></label><label><span>Mínimo</span><input type="number" min="0" value={formData.minimum} onChange={(event) => setFormData((current) => ({ ...current, minimum: event.target.value }))} /></label></div><label><span>Unidad</span><input value={formData.unit} onChange={(event) => setFormData((current) => ({ ...current, unit: event.target.value }))} placeholder="unidades" /></label>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button className="secondary-button" type="button" onClick={() => { setShowForm(false); resetForm() }}>Cancelar</button><button className="primary-button" type="submit">{editingId ? 'Guardar cambios' : 'Guardar producto'}</button></div></form></section></div>}

    <section className="panel inventory-panel"><div className="table-toolbar"><div className="search-input"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o SKU..." /></div><div className="toolbar-actions"><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoría">{categories.map((item) => <option key={item}>{item}</option>)}</select><button className="secondary-button" type="button"><Filter size={16} /> Más filtros</button><button className="icon-button" type="button" aria-label="Exportar inventario"><Download size={17} /></button><button className="icon-button" type="button" aria-label="Configurar columnas"><SlidersHorizontal size={17} /></button></div></div>
      <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Categoría</th><th>SKU</th><th>Existencias</th><th>Ubicación</th><th>Estado</th><th>Actualizado</th><th aria-label="Acciones" /></tr></thead><tbody>{filteredItems.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><span className="cell-subtitle">{item.unit}</span></td><td>{item.category}</td><td className="sku">{item.sku}</td><td><strong>{item.quantity}</strong><span className="cell-subtitle">Mín. {item.minimum}</span></td><td>{item.location}</td><td><span className={`status-pill ${item.status === 'En stock' ? 'status-ok' : item.status === 'Stock bajo' ? 'status-low' : 'status-empty'}`}><i />{item.status}</span></td><td className="muted-cell">{item.updatedAt}</td><td><div className={`cell-action-wrap ${canManageProducts ? '' : 'role-hidden'}`}><button className="icon-button small" type="button" aria-label={`Más acciones para ${item.name}`} onClick={() => setActiveMenuId((current) => current === item.id ? null : item.id)}><MoreHorizontal size={17} /></button>{activeMenuId === item.id && <div className="product-menu"><button type="button" className="product-action" onClick={() => handleEditItem(item)}><Pencil size={14} /> Editar</button><button type="button" className="product-action danger" onClick={() => handleDeleteItem(item.id)}><Trash2 size={14} /> Eliminar</button></div>}</div></td></tr>)}</tbody></table>{filteredItems.length === 0 && <div className="empty-state">No encontramos productos con esos filtros.</div>}</div><div className="table-footer"><span>Mostrando {filteredItems.length} de {items.length} productos</span><div><button className="pagination-button" type="button">Anterior</button><button className="pagination-button active" type="button">1</button><button className="pagination-button" type="button">2</button><button className="pagination-button" type="button">3</button><button className="pagination-button" type="button">Siguiente</button></div></div></section>
  </div>
}
