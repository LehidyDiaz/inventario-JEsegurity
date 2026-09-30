import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { operationsApi } from "../lib/operationsApi";
import type { AuditLog } from "../types/inventory";
const sensitive = /password|token|secret|api.?key/i;
const safe = (value: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(value).filter(([key]) => !sensitive.test(key)),
  );
export function AuditLogPanel() {
  const [items, setItems] = useState<AuditLog[]>([]),
    [action, setAction] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [expanded, setExpanded] = useState<number | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      operationsApi
        .audit({ action, from, to })
        .then(setItems)
        .catch((e) =>
          setError(
            e instanceof Error ? e.message : "No se pudo cargar la auditoría.",
          ),
        )
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [action, from, to]);
  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Seguridad</p>
          <h1>Auditoría</h1>
          <p className="intro">Historial de acciones y cambios del sistema.</p>
        </div>
      </section>
      <section className="panel">
        <div className="audit-filters">
          <div className="search-input">
            <Search size={15} />
            <input
              placeholder="Filtrar por acción..."
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        {error && <p className="form-error page-error">{error}</p>}
        {loading ? (
          <div className="loading-state">Cargando auditoría...</div>
        ) : (
          <div className="audit-timeline">
            {items.map((log) => (
              <article key={log.id}>
                <i />
                <button
                  type="button"
                  onClick={() =>
                    setExpanded(expanded === log.id ? null : log.id)
                  }
                >
                  <span>
                    <strong>{log.description || log.action}</strong>
                    <small>
                      {log.user || "Sistema"} ·{" "}
                      {log.auditableType.split("\\").pop()} #
                      {log.auditableId ?? "—"} ·{" "}
                      {new Date(log.timestamp).toLocaleString("es-CL")}
                    </small>
                  </span>
                  {expanded === log.id ? (
                    <ChevronUp size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )}
                </button>
                {expanded === log.id && (
                  <div className="change-grid">
                    <div>
                      <strong>Antes</strong>
                      <pre>{JSON.stringify(safe(log.oldValues), null, 2)}</pre>
                    </div>
                    <div>
                      <strong>Después</strong>
                      <pre>{JSON.stringify(safe(log.newValues), null, 2)}</pre>
                    </div>
                  </div>
                )}
              </article>
            ))}
            {!items.length && (
              <div className="empty-state">No hay eventos en este filtro.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
