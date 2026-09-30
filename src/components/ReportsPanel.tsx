import { Download } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { reportsApi } from "../lib/operationsApi";
import type {
  DashboardReport,
  Movement,
  Product,
  Service,
  SupplierReport,
} from "../types/inventory";
type Tab = "inventory" | "movements" | "services" | "suppliers";
export function ReportsPanel() {
  const [tab, setTab] = useState<Tab>("inventory"),
    [dashboard, setDashboard] = useState<DashboardReport | null>(null),
    [rows, setRows] = useState<
      | Array<Product & { stockValue: number }>
      | Movement[]
      | Service[]
      | SupplierReport[]
    >([]),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useEffectEvent(async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([
        reportsApi.dashboard(),
        tab === "inventory"
          ? reportsApi.inventory()
          : tab === "movements"
            ? reportsApi.movements(from, to)
            : tab === "services"
              ? reportsApi.services(from, to)
              : reportsApi.suppliers(),
      ]);
      setDashboard(d);
      setRows(r);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cargar el reporte.",
      );
    } finally {
      setLoading(false);
    }
  });
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [tab, from, to]);
  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Análisis operativo</p>
          <h1>Reportes</h1>
          <p className="intro">
            Indicadores y exportaciones basados en datos vigentes.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => void reportsApi.csv(tab, from, to)}
        >
          <Download size={16} /> Exportar CSV
        </button>
      </section>
      {dashboard && (
        <div className="module-summary">
          <div>
            <strong>${dashboard.inventoryValue.toLocaleString("es-CL")}</strong>
            <span>Valor inventario</span>
          </div>
          <div>
            <strong>{dashboard.lowStock}</strong>
            <span>Stock bajo</span>
          </div>
          <div>
            <strong>{dashboard.pendingMovements}</strong>
            <span>Movimientos pendientes</span>
          </div>
          <div>
            <strong>{dashboard.upcomingServices}</strong>
            <span>Servicios próximos</span>
          </div>
        </div>
      )}
      <section className="panel inventory-panel">
        <div className="table-toolbar">
          <div className="segmented">
            {(["inventory", "movements", "services", "suppliers"] as Tab[]).map(
              (x) => (
                <button
                  className={tab === x ? "active" : ""}
                  onClick={() => setTab(x)}
                  key={x}
                >
                  {
                    {
                      inventory: "Inventario",
                      movements: "Movimientos",
                      services: "Servicios",
                      suppliers: "Proveedores",
                    }[x]
                  }
                </button>
              ),
            )}
          </div>
          {(tab === "movements" || tab === "services") && (
            <div className="date-filters">
              <label>
                Desde{" "}
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label>
                Hasta{" "}
                <input
                  type="date"
                  min={from}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
        {error && <p className="form-error page-error">{error}</p>}
        {loading ? (
          <div className="loading-state">Generando reporte...</div>
        ) : (
          <ReportTable tab={tab} rows={rows} />
        )}
      </section>
    </div>
  );
}
function ReportTable({ tab, rows }: { tab: Tab; rows: ReportsPanelRows }) {
  if (!rows.length)
    return <div className="empty-state">No hay datos para el período.</div>;
  if (tab === "inventory") {
    const data = rows as Array<Product & { stockValue: number }>;
    return (
      <>
        <div className="css-bars">
          {data.slice(0, 12).map((p) => (
            <div key={p.id}>
              <span>{p.name}</span>
              <i
                style={{
                  width: `${Math.max(2, (p.quantity / Math.max(1, ...data.map((x) => x.quantity))) * 100)}%`,
                }}
              />
              <strong>{p.quantity}</strong>
            </div>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td>{p.quantity}</td>
                  <td>{p.status}</td>
                  <td>${p.stockValue.toLocaleString("es-CL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  if (tab === "movements") {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>
            {(rows as Movement[]).map((m) => (
              <tr key={m.id}>
                <td>{m.folio}</td>
                <td>{new Date(m.date).toLocaleString("es-CL")}</td>
                <td>{m.type}</td>
                <td>{m.status}</td>
                <td>{m.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (tab === "services")
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Servicio</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(rows as Service[]).map((s) => (
              <tr key={s.id}>
                <td>{s.folio}</td>
                <td>{s.title}</td>
                <td>{s.client}</td>
                <td>{new Date(s.scheduledAt).toLocaleString("es-CL")}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Estado</th>
            <th>Productos</th>
            <th>Órdenes</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {(rows as SupplierReport[]).map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.status}</td>
              <td>{s.productCount}</td>
              <td>{s.orderCount}</td>
              <td>${s.purchaseTotal.toLocaleString("es-CL")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
type ReportsPanelRows =
  | Array<Product & { stockValue: number }>
  | Movement[]
  | Service[]
  | SupplierReport[];
