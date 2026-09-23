import { MapPin, Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { deleteCatalogItem, getCatalog, saveCatalogItem, type CatalogItem, type CatalogType } from '../lib/catalogApi'

type FormState = { name: string; detail: string }

export function SettingsPanel() {
  const [categories, setCategories] = useState<CatalogItem[]>([])
  const [locations, setLocations] = useState<CatalogItem[]>([])
  const [editing, setEditing] = useState<{ type: CatalogType; item?: CatalogItem } | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', detail: '' })
  const [error, setError] = useState('')

  const loadCatalogs = async () => {
    const [nextCategories, nextLocations] = await Promise.all([getCatalog('categories'), getCatalog('locations')])
    setCategories(nextCategories)
    setLocations(nextLocations)
  }

  useEffect(() => { loadCatalogs().catch((loadError: Error) => setError(loadError.message)) }, [])

  const openForm = (type: CatalogType, item?: CatalogItem) => {
    setEditing({ type, item })
    setForm({ name: item?.name ?? '', detail: item?.description ?? item?.address ?? '' })
    setError('')
  }

  const closeForm = () => { setEditing(null); setForm({ name: '', detail: '' }); setError('') }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editing || !form.name.trim()) { setError('El nombre es obligatorio.'); return }
    const payload = editing.type === 'categories'
      ? { id: editing.item?.id, name: form.name.trim(), description: form.detail.trim() }
      : { id: editing.item?.id, name: form.name.trim(), address: form.detail.trim() }
    try { await saveCatalogItem(editing.type, payload); await loadCatalogs(); closeForm() }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar.') }
  }

  const handleDelete = async (type: CatalogType, id: string) => {
    try { await deleteCatalogItem(type, id); await loadCatalogs() }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar.') }
  }

  const renderList = (type: CatalogType, items: CatalogItem[], title: string, icon: typeof Tag, detailLabel: string) => {
    const Icon = icon
    return <section className="panel settings-panel"><div className="panel-heading"><div><h2><Icon size={16} /> {title}</h2><p>Administra las opciones disponibles en Inventario.</p></div><button className="primary-button" type="button" onClick={() => openForm(type)}><Plus size={16} /> Nueva</button></div><div className="settings-list">{items.map((item) => <div className="settings-row" key={item.id}><div><strong>{item.name}</strong><span>{detailLabel === 'Descripción' ? item.description || 'Sin descripción' : item.address || 'Sin dirección'}</span></div><div className="settings-actions"><button className="icon-button" type="button" aria-label={`Editar ${item.name}`} onClick={() => openForm(type, item)}><Pencil size={15} /></button><button className="icon-button danger-icon" type="button" aria-label={`Eliminar ${item.name}`} onClick={() => handleDelete(type, item.id)}><Trash2 size={15} /></button></div></div>)}</div></section>
  }

  return <div className="module-view settings-view"><section className="page-heading"><div><p className="eyebrow">Administración</p><h1>Configuración</h1><p className="intro">Solo administradores pueden modificar estos catálogos.</p></div></section>{error && <p className="form-error settings-error">{error}</p>}{editing && <section className="panel inventory-form-panel"><h2>{editing.item ? 'Editar' : 'Nueva'} {editing.type === 'categories' ? 'categoría' : 'ubicación'}</h2><form className="product-form" onSubmit={handleSubmit}><label><span>Nombre</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus /></label><label><span>{editing.type === 'categories' ? 'Descripción' : 'Dirección'}</span><input value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} /></label><div className="form-actions"><button className="secondary-button" type="button" onClick={closeForm}>Cancelar</button><button className="primary-button" type="submit">Guardar</button></div></form></section>}<div className="settings-grid">{renderList('categories', categories, 'Categorías', Tag, 'Descripción')}{renderList('locations', locations, 'Ubicaciones', MapPin, 'Dirección')}</div></div>
}