import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Check,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import { productsApi } from "../lib/inventoryApi";
import { movementsApi, servicesApi, suppliersApi } from "../lib/resources";
import type {
  Movement,
  MovementPayload,
  Product,
  Service,
  Supplier,
} from "../types/inventory";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";
type ItemForm = { productId: string; quantity: string };
const empty = {
  type: "in" as Movement["type"],
  reference: "",
  origin: "",
  status: "Confirmado",
  date: "",
  supplierId: "",
  serviceId: "",
  items: [{ productId: "", quantity: "1" }] as ItemForm[],
};
const config = {
  in: { label: "Entrada", icon: ArrowDownLeft, className: "type-in" },
  out: { label: "Salida", icon: ArrowUpRight, className: "type-out" },
  adjustment: { label: "Ajuste", icon: Boxes, className: "type-adjustment" },
};
export function MovementsPanel({
  canManage,
  canApprove,
  canEdit,
}: {
  canManage: boolean;
  canApprove: boolean;
  canEdit: boolean;
}) {
  const [movements, setMovements] = useState<Movement[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [suppliers, setSuppliers] = useState<Supplier[]>([]),
    [services, setServices] = useState<Service[]>([]),
    [form, setForm] = useState(empty),
    [editing, setEditing] = useState<Movement | null>(null),
    [deleting, setDeleting] = useState<Movement | null>(null),
    [detail, setDetail] = useState<Movement | null>(null),
    [rejecting, setRejecting] = useState<Movement | null>(null),
    [reason, setReason] = useState(""),
    [approving, setApproving] = useState<Movement | null>(null),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const [m, p, s, v] = await Promise.all([
        movementsApi.list(),
        productsApi.list(),
        suppliersApi.list(),
        servicesApi.list(),
      ]);
      setMovements(m);
      setProducts(p);
      setSuppliers(s);
      setServices(v);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron cargar los movimientos.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const filtered = useMemo(
    () =>
      movements.filter(
        (m) =>
          (!filter || m.status === filter) &&
          `${m.folio} ${m.reference} ${m.origin} ${m.items.map((i) => i.product).join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [movements, query, filter],
  );
  const edit = (m?: Movement) => {
    setEditing(m ?? null);
    setForm(
      m
        ? {
            type: m.type,
            reference: m.reference,
            origin: m.origin,
      status: m.status === "Rechazado" ? "Pendiente" : m.status,
            date: new Date(m.date).toISOString().slice(0, 16),
            supplierId: m.supplierId ? String(m.supplierId) : "",
            serviceId: m.serviceId ? String(m.serviceId) : "",
            items: m.items.map((i) => ({
              productId: String(i.productId),
              quantity: String(i.quantity),
            })),
          }
        : {
            ...empty,
            date: new Date().toISOString().slice(0, 16),
            items: [
              { productId: String(products[0]?.id ?? ""), quantity: "1" },
            ],
          },
    );
    setOpen(true);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: MovementPayload = {
      type: form.type,
      reference: form.reference.trim(),
      origin: form.origin.trim(),
      status: form.status,
      date: form.date,
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      serviceId: form.serviceId ? Number(form.serviceId) : null,
      items: form.items.map((i) => ({
        productId: Number(i.productId),
        quantity: Number(i.quantity),
      })),
    };
    setBusy(true);
    try {
      if (editing) await movementsApi.update(editing.id, payload);
      else await movementsApi.create(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };
  const approveReject = async (kind: "approve" | "reject") => {
    const m = kind === "approve" ? approving : rejecting;
    if (!m) return;
    setBusy(true);
    try {
      await apiRequest(`/movements/${m.id}/${kind}`, {
        method: "POST",
        body: kind === "reject" ? { reason } : undefined,
      });
      setApproving(null);
      setRejecting(null);
      setReason("");
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo revisar el movimiento.",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await movementsApi.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  };
  const summary = {
    in: movements.filter((m) => m.type === "in").length,
    out: movements.filter((m) => m.type === "out").length,
    pending: movements.filter((m) => m.status === "Pendiente").length,
    rejected: movements.filter((m) => m.status === "Rechazado").length,
  };
  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Operación</p>
          <h1>Movimientos</h1>
          <p className="intro">
            Entradas, salidas y ajustes con aprobación de stock.
          </p>
        </div>
        {canManage && (
          <button className="primary-button" onClick={() => edit()}>
            <Plus size={16} /> Registrar movimiento
          </button>
        )}
      </section>
      <div className="module-summary">
        <div>
          <strong>{summary.in}</strong>
          <span>Entradas</span>
        </div>
        <div>
          <strong>{summary.out}</strong>
          <span>Salidas</span>
        </div>
        <div>
          <strong className="amber-text">{summary.pending}</strong>
          <span>Pendientes</span>
        </div>
        <div>
          <strong className="red-text">{summary.rejected}</strong>
          <span>Rechazados</span>
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
              placeholder="Buscar folio, referencia o producto..."
            />
          </div>
          <div className="toolbar-actions">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              <option>Pendiente</option>
              <option>Confirmado</option>
              <option>Revisión</option>
              <option>Rechazado</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">Cargando movimientos...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Folio / tipo</th>
                  <th>Productos</th>
                  <th>Referencia</th>
                  <th>Fecha</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const c = config[m.type],
                    Icon = c.icon;
                  return (
                    <tr
                      className={m.status === "Pendiente" ? "pending-row" : ""}
                      key={m.id}
                    >
                      <td>
                        <strong>{m.folio}</strong>
                        <span
                          className={`status-pill movement-type ${c.className}`}
                        >
                          <Icon size={11} />
                          {c.label}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {m.items.map((i) => i.product).join(", ")}
                        </strong>
                        <span className="cell-subtitle">
                          {m.items
                            .map((i) => `${i.quantity} ${i.unit}`)
                            .join(" · ")}
                        </span>
                      </td>
                      <td>
                        {m.reference}
                        <span className="cell-subtitle">
                          {m.origin || "Sin origen"}
                        </span>
                      </td>
                      <td>{new Date(m.date).toLocaleString("es-CL")}</td>
                      <td>{m.user}</td>
                      <td>
                        <span
                          className={`status-pill ${m.status === "Confirmado" ? "status-ok" : m.status === "Pendiente" ? "status-low" : "status-empty"}`}
                        >
                          <i />
                          {m.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            title="Ver detalle"
                            onClick={() => setDetail(m)}
                          >
                            <Eye size={14} />
                          </button>
                          {canApprove && m.status === "Pendiente" && (
                            <>
                              <button
                                className="icon-button green-text"
                                title="Aprobar"
                                onClick={() => setApproving(m)}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                className="icon-button danger-icon"
                                title="Rechazar"
                                onClick={() => setRejecting(m)}
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                          {canEdit && (
                            <>
                              <button
                                className="icon-button"
                                title="Editar"
                                onClick={() => edit(m)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className="icon-button danger-icon"
                                title="Eliminar"
                                onClick={() => setDeleting(m)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="empty-state">
                No hay movimientos para mostrar.
              </div>
            )}
          </div>
        )}
        <div className="table-footer">
          Mostrando {filtered.length} de {movements.length} movimientos
        </div>
      </section>
      <Modal
        open={open}
        title={editing ? "Editar movimiento" : "Registrar movimiento"}
        onClose={() => setOpen(false)}
        wide
      >
        <form className="product-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              <span>Tipo *</span>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as Movement["type"] })
                }
              >
                <option value="in">Entrada</option>
                <option value="out">Salida</option>
                <option value="adjustment">Ajuste</option>
              </select>
            </label>
            {canApprove && (
              <label>
                <span>Estado *</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Confirmado</option>
                  <option>Pendiente</option>
                  <option>Revisión</option>
                </select>
              </label>
            )}
            <label>
              <span>Referencia</span>
              <input
                value={form.reference}
                placeholder="Se usará el folio si se deja vacío"
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
              />
            </label>
            <label>
              <span>Fecha *</span>
              <input
                required
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label>
              <span>Origen</span>
              <input
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </label>
            <label>
              <span>Proveedor</span>
              <select
                value={form.supplierId}
                onChange={(e) =>
                  setForm({ ...form, supplierId: e.target.value })
                }
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Servicio</span>
              <select
                value={form.serviceId}
                onChange={(e) =>
                  setForm({ ...form, serviceId: e.target.value })
                }
              >
                <option value="">Sin servicio</option>
                {services.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.folio} · {s.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="detail-heading">
            <div>
              <strong>Productos</strong>
              <span>En ajustes, la cantidad será el stock final.</span>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setForm({
                  ...form,
                  items: [...form.items, { productId: "", quantity: "1" }],
                })
              }
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
          <div className="detail-list">
            {form.items.map((item, index) => (
              <div className="detail-row" key={index}>
                <select
                  required
                  value={item.productId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      items: form.items.map((x, i) =>
                        i === index ? { ...x, productId: e.target.value } : x,
                      ),
                    })
                  }
                >
                  <option value="">Producto</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} ({p.quantity})
                    </option>
                  ))}
                </select>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      items: form.items.map((x, i) =>
                        i === index ? { ...x, quantity: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="icon-button danger-icon"
                  disabled={form.items.length === 1}
                  onClick={() =>
                    setForm({
                      ...form,
                      items: form.items.filter((_, i) => i !== index),
                    })
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
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
      <Modal
        open={Boolean(detail)}
        title={detail?.folio ?? "Detalle"}
        onClose={() => setDetail(null)}
        wide
      >
        {detail && (
          <>
            <div className="detail-grid">
              <div>
                <span>Referencia</span>
                <strong>{detail.reference}</strong>
              </div>
              <div>
                <span>Estado</span>
                <strong>{detail.status}</strong>
              </div>
              <div>
                <span>Responsable</span>
                <strong>{detail.user}</strong>
              </div>
              <div>
                <span>Revisado</span>
                <strong>
                  {detail.reviewedAt
                    ? new Date(detail.reviewedAt).toLocaleString("es-CL")
                    : "Pendiente"}
                </strong>
              </div>
            </div>
            {detail.rejectionReason && (
              <p className="rejection-box">
                <strong>Motivo de rechazo:</strong> {detail.rejectionReason}
              </p>
            )}
            <div className="settings-list">
              {detail.items.map((i) => (
                <div className="settings-row" key={i.productId}>
                  <div>
                    <strong>{i.product}</strong>
                    <span>{i.category}</span>
                  </div>
                  <strong>
                    {i.quantity} {i.unit}
                  </strong>
                </div>
              ))}
            </div>
            <AttachmentsPanel
              entityType="movements"
              entityId={detail.id}
              canDelete={canApprove}
            />
          </>
        )}
      </Modal>
      <Modal
        open={Boolean(rejecting)}
        title={`Rechazar ${rejecting?.folio ?? ""}`}
        onClose={() => setRejecting(null)}
      >
        <div className="product-form">
          <label>
            <span>Razón del rechazo *</span>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button
              className="secondary-button"
              onClick={() => setRejecting(null)}
            >
              Cancelar
            </button>
            <button
              className="danger-button"
              disabled={busy || !reason.trim()}
              onClick={() => void approveReject("reject")}
            >
              Rechazar
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(approving)}
        message={`¿Aprobar ${approving?.folio ?? "este movimiento"}? Esta acción modificará el stock.`}
        busy={busy}
        onCancel={() => setApproving(null)}
        onConfirm={() => void approveReject("approve")}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        message={`¿Eliminar ${deleting?.folio ?? "este movimiento"}? El stock confirmado será revertido.`}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
