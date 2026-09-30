import {
  Check,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { productsApi } from "../lib/inventoryApi";
import { apiRequest } from "../lib/api";
import { purchasesApi, suppliersApi } from "../lib/resources";
import type {
  Product,
  PurchaseOrder,
  PurchaseOrderPayload,
  Supplier,
} from "../types/inventory";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";

type Line = { productId: string; orderedQuantity: string; unitPrice: string };
const blank = {
  supplierId: "",
  orderDate: "",
  expectedDate: "",
  status: "Borrador" as PurchaseOrder["status"],
  notes: "",
  items: [{ productId: "", orderedQuantity: "1", unitPrice: "0" }] as Line[],
};
export function PurchaseOrdersPanel() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]),
    [suppliers, setSuppliers] = useState<Supplier[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState(blank),
    [editing, setEditing] = useState<PurchaseOrder | null>(null),
    [open, setOpen] = useState(false),
    [detail, setDetail] = useState<PurchaseOrder | null>(null),
    [deleting, setDeleting] = useState<PurchaseOrder | null>(null),
    [action, setAction] = useState<{
      order: PurchaseOrder;
      kind: "send" | "approve";
    } | null>(null),
    [receiving, setReceiving] = useState<PurchaseOrder | null>(null),
    [received, setReceived] = useState<Record<number, string>>({});
  const load = async () => {
    setLoading(true);
    try {
      const [o, s, p] = await Promise.all([
        purchasesApi.list(),
        suppliersApi.list(),
        productsApi.list(),
      ]);
      setOrders(o);
      setSuppliers(s);
      setProducts(p);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar las compras.",
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
      orders.filter(
        (o) =>
          (!status || o.status === status) &&
          `${o.folio} ${o.supplier}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [orders, query, status],
  );
  const edit = (o?: PurchaseOrder) => {
    setEditing(o ?? null);
    setForm(
      o
        ? {
            supplierId: String(o.supplierId),
            orderDate: o.orderDate,
            expectedDate: o.expectedDate ?? "",
            status: o.status,
            notes: o.notes,
            items: o.items.map((i) => ({
              productId: String(i.productId),
              orderedQuantity: String(i.orderedQuantity),
              unitPrice: String(i.unitPrice),
            })),
          }
        : {
            ...blank,
            supplierId: String(suppliers[0]?.id ?? ""),
            orderDate: new Date().toISOString().slice(0, 10),
            items: [
              {
                productId: String(products[0]?.id ?? ""),
                orderedQuantity: "1",
                unitPrice: String(products[0]?.purchasePrice ?? 0),
              },
            ],
          },
    );
    setOpen(true);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: PurchaseOrderPayload = {
      supplierId: Number(form.supplierId),
      orderDate: form.orderDate,
      expectedDate: form.expectedDate || null,
      status: form.status,
      notes: form.notes,
      items: form.items.map((i) => ({
        productId: Number(i.productId),
        orderedQuantity: Number(i.orderedQuantity),
        unitPrice: Number(i.unitPrice),
      })),
    };
    setBusy(true);
    setError("");
    try {
      if (editing) await purchasesApi.update(editing.id, payload);
      else await purchasesApi.create(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la orden.",
      );
    } finally {
      setBusy(false);
    }
  };
  const runAction = async () => {
    if (!action) return;
    setBusy(true);
    try {
      await apiRequest(`/purchase-orders/${action.order.id}/${action.kind}`, {
        method: "POST",
      });
      setAction(null);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la acción.",
      );
    } finally {
      setBusy(false);
    }
  };
  const receive = async () => {
    if (!receiving) return;
    const items = receiving.items
      .map((i) => ({ itemId: i.id, quantity: Number(received[i.id] || 0) }))
      .filter((i) => i.quantity > 0);
    if (!items.length) {
      setError("Indica al menos una cantidad a recibir.");
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`/purchase-orders/${receiving.id}/receive`, {
        method: "POST",
        body: { items },
      });
      setReceiving(null);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo registrar la recepción.",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await purchasesApi.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  };
  const totals = {
    pending: orders.filter((o) => ["Enviada", "Parcial"].includes(o.status))
      .length,
    received: orders.filter((o) => o.status === "Recibida").length,
    value: orders.reduce((s, o) => s + o.total, 0),
  };
  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Abastecimiento</p>
          <h1>Compras</h1>
          <p className="intro">
            Órdenes, aprobaciones y recepción de inventario.
          </p>
        </div>
        <button className="primary-button" onClick={() => edit()}>
          <Plus size={16} /> Nueva orden
        </button>
      </section>
      <div className="module-summary">
        <div>
          <strong>{orders.length}</strong>
          <span>Órdenes</span>
        </div>
        <div>
          <strong className="amber-text">{totals.pending}</strong>
          <span>Pendientes de recepción</span>
        </div>
        <div>
          <strong className="green-text">{totals.received}</strong>
          <span>Recibidas</span>
        </div>
        <div>
          <strong>${totals.value.toLocaleString("es-CL")}</strong>
          <span>Total ordenado</span>
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
              placeholder="Buscar folio o proveedor..."
            />
          </div>
          <div className="toolbar-actions">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              {["Borrador", "Enviada", "Parcial", "Recibida", "Cancelada"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">Cargando compras...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Proveedor</th>
                  <th>Fechas</th>
                  <th>Total</th>
                  <th>Recepción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const ordered = o.items.reduce(
                      (s, i) => s + i.orderedQuantity,
                      0,
                    ),
                    done = o.items.reduce((s, i) => s + i.receivedQuantity, 0);
                  return (
                    <tr key={o.id}>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => setDetail(o)}
                        >
                          <strong>{o.folio}</strong>
                        </button>
                      </td>
                      <td>{o.supplier}</td>
                      <td>
                        {new Date(`${o.orderDate}T00:00`).toLocaleDateString(
                          "es-CL",
                        )}
                        <span className="cell-subtitle">
                          Esperada:{" "}
                          {o.expectedDate
                            ? new Date(
                                `${o.expectedDate}T00:00`,
                              ).toLocaleDateString("es-CL")
                            : "Sin fecha"}
                        </span>
                      </td>
                      <td>
                        <strong>${o.total.toLocaleString("es-CL")}</strong>
                      </td>
                      <td>
                        <progress value={done} max={ordered || 1} />
                        <span className="cell-subtitle">
                          {done} de {ordered}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${o.status === "Recibida" ? "status-ok" : o.status === "Cancelada" ? "status-empty" : "status-low"}`}
                        >
                          <i />
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {!["Recibida", "Cancelada"].includes(o.status) && (
                            <button
                              className="icon-button"
                              onClick={() => edit(o)}
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {o.status === "Borrador" && (
                            <button
                              className="icon-button"
                              onClick={() =>
                                setAction({ order: o, kind: "send" })
                              }
                              title="Enviar"
                            >
                              <Send size={14} />
                            </button>
                          )}
                          {["Borrador", "Enviada"].includes(o.status) &&
                            !o.approvedBy && (
                              <button
                                className="icon-button"
                                onClick={() =>
                                  setAction({ order: o, kind: "approve" })
                                }
                                title="Aprobar"
                              >
                                <Check size={14} />
                              </button>
                            )}
                          {["Enviada", "Parcial"].includes(o.status) && (
                            <button
                              className="icon-button"
                              onClick={() => {
                                setReceiving(o);
                                setReceived({});
                              }}
                              title="Recibir"
                            >
                              <PackageCheck size={14} />
                            </button>
                          )}
                          {o.status === "Borrador" && (
                            <button
                              className="icon-button danger-icon"
                              onClick={() => setDeleting(o)}
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="empty-state">No hay órdenes para mostrar.</div>
            )}
          </div>
        )}
        <div className="table-footer">
          Mostrando {filtered.length} de {orders.length} órdenes
        </div>
      </section>
      <Modal
        open={open}
        title={editing ? "Editar orden" : "Nueva orden"}
        onClose={() => setOpen(false)}
        wide
      >
        <form className="product-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              <span>Proveedor *</span>
              <select
                required
                value={form.supplierId}
                onChange={(e) =>
                  setForm({ ...form, supplierId: e.target.value })
                }
              >
                <option value="">Selecciona</option>
                {suppliers.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Estado *</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as PurchaseOrder["status"],
                  })
                }
              >
                <option>Borrador</option>
                <option>Enviada</option>
                <option>Cancelada</option>
              </select>
            </label>
            <label>
              <span>Fecha de orden *</span>
              <input
                required
                type="date"
                value={form.orderDate}
                onChange={(e) =>
                  setForm({ ...form, orderDate: e.target.value })
                }
              />
            </label>
            <label>
              <span>Fecha esperada</span>
              <input
                type="date"
                min={form.orderDate}
                value={form.expectedDate}
                onChange={(e) =>
                  setForm({ ...form, expectedDate: e.target.value })
                }
              />
            </label>
          </div>
          <label>
            <span>Notas</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="detail-heading">
            <div>
              <strong>Productos</strong>
              <span>Partidas de la orden</span>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setForm({
                  ...form,
                  items: [
                    ...form.items,
                    { productId: "", orderedQuantity: "1", unitPrice: "0" },
                  ],
                })
              }
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
          <div className="purchase-lines">
            {form.items.map((line, index) => (
              <div className="purchase-line" key={index}>
                <select
                  required
                  value={line.productId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      items: form.items.map((x, i) =>
                        i === index
                          ? {
                              ...x,
                              productId: e.target.value,
                              unitPrice: String(
                                products.find(
                                  (p) => p.id === Number(e.target.value),
                                )?.purchasePrice ?? x.unitPrice,
                              ),
                            }
                          : x,
                      ),
                    })
                  }
                >
                  <option value="">Producto</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Cantidad"
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={line.orderedQuantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      items: form.items.map((x, i) =>
                        i === index
                          ? { ...x, orderedQuantity: e.target.value }
                          : x,
                      ),
                    })
                  }
                />
                <input
                  aria-label="Precio unitario"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      items: form.items.map((x, i) =>
                        i === index ? { ...x, unitPrice: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  className="icon-button danger-icon"
                  type="button"
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
        title={detail?.folio ?? "Detalle de compra"}
        onClose={() => setDetail(null)}
        wide
      >
        {detail && (
          <>
            <div className="detail-grid">
              <div>
                <span>Proveedor</span>
                <strong>{detail.supplier}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>${detail.total.toLocaleString("es-CL")}</strong>
              </div>
              <div>
                <span>Estado</span>
                <strong>{detail.status}</strong>
              </div>
              <div>
                <span>Fecha</span>
                <strong>{detail.orderDate}</strong>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Ordenado</th>
                    <th>Recibido</th>
                    <th>Pendiente</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.product}</td>
                      <td>{i.orderedQuantity}</td>
                      <td>{i.receivedQuantity}</td>
                      <td>{i.pendingQuantity}</td>
                      <td>${i.unitPrice.toLocaleString("es-CL")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AttachmentsPanel
              entityType="purchase-orders"
              entityId={detail.id}
              canDelete
            />
          </>
        )}
      </Modal>
      <Modal
        open={Boolean(receiving)}
        title={`Recibir ${receiving?.folio ?? ""}`}
        onClose={() => setReceiving(null)}
      >
        {receiving && (
          <div className="product-form">
            <p className="confirm-message">
              Registra solo lo recibido ahora. El stock se actualizará al
              confirmar.
            </p>
            {receiving.items
              .filter((i) => i.pendingQuantity > 0)
              .map((i) => (
                <label key={i.id}>
                  <span>
                    {i.product} · pendiente {i.pendingQuantity}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={i.pendingQuantity}
                    step="0.01"
                    value={received[i.id] ?? ""}
                    onChange={(e) =>
                      setReceived({ ...received, [i.id]: e.target.value })
                    }
                  />
                </label>
              ))}
            <div className="form-actions">
              <button
                className="secondary-button"
                onClick={() => setReceiving(null)}
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                disabled={busy}
                onClick={() => void receive()}
              >
                Confirmar recepción
              </button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(action)}
        message={`¿${action?.kind === "approve" ? "Aprobar" : "Enviar"} la orden ${action?.order.folio ?? ""}?`}
        busy={busy}
        onCancel={() => setAction(null)}
        onConfirm={() => void runAction()}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        message={`¿Eliminar ${deleting?.folio ?? "esta orden"}?`}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
