import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { productsApi } from "../lib/inventoryApi";
import { operationsApi } from "../lib/operationsApi";
import { batchesApi } from "../lib/resources";
import type {
  ExpirationSummary,
  Product,
  ProductBatch,
  ProductBatchPayload,
} from "../types/inventory";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";
const blank = {
  productId: "",
  lotNumber: "",
  serialNumber: "",
  quantity: "0",
  expirationDate: "",
  nextInspectionAt: "",
  status: "Activo" as ProductBatch["status"],
  notes: "",
};
export function ExpirationsPanel({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<ProductBatch[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [summary, setSummary] = useState<ExpirationSummary>({
      expired: 0,
      upcoming: 0,
      inspectionsDue: 0,
    }),
    [filter, setFilter] = useState(""),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<ProductBatch | null>(null),
    [deleting, setDeleting] = useState<ProductBatch | null>(null),
    [form, setForm] = useState(blank),
    [dates] = useState(() => ({
      today: new Date().toISOString().slice(0, 10),
      limit: new Date(new Date().setDate(new Date().getDate() + 30))
        .toISOString()
        .slice(0, 10),
    }));
  const load = async () => {
    setLoading(true);
    try {
      const [b, p, s] = await Promise.all([
        batchesApi.list(),
        productsApi.list(),
        operationsApi.expirationSummary(),
      ]);
      setItems(b);
      setProducts(p);
      setSummary(s);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron cargar los vencimientos.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const shown = useMemo(
    () =>
      items.filter((b) => {
        const matches = `${b.product} ${b.lotNumber} ${b.serialNumber ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const state = !filter
          ? true
          : filter === "expired"
            ? b.status === "Vencido" ||
              Boolean(b.expirationDate && b.expirationDate < dates.today)
            : filter === "upcoming"
              ? Boolean(
                  b.expirationDate &&
                    b.expirationDate >= dates.today &&
                    b.expirationDate <= dates.limit,
                )
              : b.status === filter;
        return matches && state;
      }),
    [items, query, filter, dates],
  );
  const edit = (b?: ProductBatch) => {
    setEditing(b ?? null);
    setForm(
      b
        ? {
            productId: String(b.productId),
            lotNumber: b.lotNumber,
            serialNumber: b.serialNumber ?? "",
            quantity: String(b.quantity),
            expirationDate: b.expirationDate ?? "",
            nextInspectionAt: b.nextInspectionAt ?? "",
            status: b.status,
            notes: b.notes,
          }
        : { ...blank, productId: String(products[0]?.id ?? "") },
    );
    setOpen(true);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: ProductBatchPayload = {
      productId: Number(form.productId),
      lotNumber: form.lotNumber.trim(),
      serialNumber: form.serialNumber.trim() || null,
      quantity: Number(form.quantity),
      expirationDate: form.expirationDate || null,
      nextInspectionAt: form.nextInspectionAt || null,
      status: form.status,
      notes: form.notes.trim(),
    };
    setBusy(true);
    try {
      if (editing) await batchesApi.update(editing.id, payload);
      else await batchesApi.create(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el lote.",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await batchesApi.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Control preventivo</p>
          <h1>Vencimientos</h1>
          <p className="intro">Lotes, series e inspecciones de equipos.</p>
        </div>
        {canManage && (
          <button className="primary-button" onClick={() => edit()}>
            <Plus size={16} /> Nuevo lote
          </button>
        )}
      </section>
      <div className="module-summary">
        <div>
          <strong>{items.length}</strong>
          <span>Lotes registrados</span>
        </div>
        <div>
          <strong className="red-text">{summary.expired}</strong>
          <span>Vencidos</span>
        </div>
        <div>
          <strong className="amber-text">{summary.upcoming}</strong>
          <span>Próximos 30 días</span>
        </div>
        <div>
          <strong>{summary.inspectionsDue}</strong>
          <span>Inspecciones próximas</span>
        </div>
      </div>
      {error && !open && <p className="form-error page-error">{error}</p>}
      <section className="panel inventory-panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto, lote o serie..."
            />
          </div>
          <div className="toolbar-actions">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="expired">Vencidos</option>
              <option value="upcoming">Próximos</option>
              <option value="Activo">Activos</option>
              <option value="Consumido">Consumidos</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">Cargando lotes...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Lote / serie</th>
                  <th>Cantidad</th>
                  <th>Vencimiento</th>
                  <th>Inspección</th>
                  <th>Estado</th>
                  {canManage && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((b) => {
                  const expired =
                    b.status === "Vencido" ||
                    Boolean(
                      b.expirationDate &&
                        b.expirationDate <
                          new Date().toISOString().slice(0, 10),
                    );
                  return (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.product}</strong>
                      </td>
                      <td>
                        {b.lotNumber}
                        <span className="cell-subtitle">
                          {b.serialNumber || "Sin serie"}
                        </span>
                      </td>
                      <td>{b.quantity}</td>
                      <td className={expired ? "red-text" : ""}>
                        {b.expirationDate
                          ? new Date(
                              `${b.expirationDate}T00:00`,
                            ).toLocaleDateString("es-CL")
                          : "Sin fecha"}
                      </td>
                      <td>
                        {b.nextInspectionAt
                          ? new Date(
                              `${b.nextInspectionAt}T00:00`,
                            ).toLocaleDateString("es-CL")
                          : "Sin fecha"}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${expired ? "status-empty" : b.status === "Activo" ? "status-ok" : "status-low"}`}
                        >
                          <i />
                          {b.status}
                        </span>
                      </td>
                      {canManage && (
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              onClick={() => edit(b)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="icon-button danger-icon"
                              onClick={() => setDeleting(b)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!shown.length && (
              <div className="empty-state">No hay lotes en este filtro.</div>
            )}
          </div>
        )}
        <div className="table-footer">
          Mostrando {shown.length} de {items.length} lotes
        </div>
      </section>
      <Modal
        open={open}
        title={editing ? "Editar lote" : "Nuevo lote"}
        onClose={() => setOpen(false)}
        wide
      >
        <form className="product-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              <span>Producto *</span>
              <select
                required
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
              >
                <option value="">Selecciona</option>
                {products.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Número de lote *</span>
              <input
                required
                value={form.lotNumber}
                onChange={(e) =>
                  setForm({ ...form, lotNumber: e.target.value })
                }
              />
            </label>
            <label>
              <span>Número de serie</span>
              <input
                value={form.serialNumber}
                onChange={(e) =>
                  setForm({ ...form, serialNumber: e.target.value })
                }
              />
            </label>
            <label>
              <span>Cantidad *</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </label>
            <label>
              <span>Vencimiento</span>
              <input
                type="date"
                value={form.expirationDate}
                onChange={(e) =>
                  setForm({ ...form, expirationDate: e.target.value })
                }
              />
            </label>
            <label>
              <span>Próxima inspección</span>
              <input
                type="date"
                value={form.nextInspectionAt}
                onChange={(e) =>
                  setForm({ ...form, nextInspectionAt: e.target.value })
                }
              />
            </label>
            <label>
              <span>Estado *</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as ProductBatch["status"],
                  })
                }
              >
                <option>Activo</option>
                <option>Vencido</option>
                <option>Consumido</option>
              </select>
            </label>
          </div>
          <label>
            <span>Notas</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </button>
            <button className="primary-button" disabled={busy}>
              Guardar
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        message={`¿Eliminar el lote ${deleting?.lotNumber ?? ""}?`}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
