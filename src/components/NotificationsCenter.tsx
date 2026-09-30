import { Bell, CheckCheck, RefreshCw, Settings2 } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { notificationsApi } from "../lib/operationsApi";
import type { Notification, NotificationPreferences } from "../types/inventory";
import type { Section } from "./Sidebar";
import { Modal } from "./Modal";

const defaults: NotificationPreferences = {
  stock: true,
  services: true,
  movements: true,
  expirations: true,
  purchases: true,
};
const destination = (url: string | null): Section | null =>
  url?.startsWith("/product-batches")
    ? "Vencimientos"
    : url?.startsWith("/purchase-orders")
      ? "Compras"
      : url?.startsWith("/movements")
        ? "Movimientos"
        : url?.startsWith("/services")
          ? "Servicios"
          : url?.startsWith("/products")
            ? "Inventario"
            : null;
export function NotificationsCenter({
  open,
  onClose,
  onNavigate,
  onUnread,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (section: Section) => void;
  onUnread: (count: number) => void;
}) {
  const [items, setItems] = useState<Notification[]>([]),
    [prefs, setPrefs] = useState(defaults),
    [filter, setFilter] = useState<"all" | "unread" | "priority">("all"),
    [settings, setSettings] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = async (silent = false) => {
    if (!silent) setBusy(true);
    try {
      const [list, preferences] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.preferences(),
      ]);
      setItems(list);
      setPrefs(preferences);
      onUnread(list.filter((n) => !n.readAt).length);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron cargar las notificaciones.",
      );
    } finally {
      setBusy(false);
    }
  };
  const poll = useEffectEvent((silent = false) => load(silent));
  useEffect(() => {
    const initial = window.setTimeout(() => void poll(), 0),
      timer = window.setInterval(() => void poll(true), 60000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void poll(true), 0);
    return () => window.clearTimeout(timer);
  }, [open]);
  const read = async (item: Notification) => {
    if (!item.readAt) await notificationsApi.read(item.id);
    const section = destination(item.actionUrl);
    await load(true);
    if (section) {
      onNavigate(section);
      onClose();
    }
  };
  const visible = items.filter(
    (n) =>
      filter === "all" ||
      (filter === "unread" ? !n.readAt : n.priority === "high"),
  );
  const savePrefs = async (next: NotificationPreferences) => {
    setPrefs(next);
    try {
      await notificationsApi.updatePreferences(next);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron guardar las preferencias.",
      );
    }
  };
  return (
    <Modal open={open} title="Centro de notificaciones" onClose={onClose} wide>
      <div className="notification-toolbar">
        <div className="segmented">
          {(
            [
              ["all", "Todas"],
              ["unread", "No leídas"],
              ["priority", "Prioridad"],
            ] as const
          ).map(([key, label]) => (
            <button
              type="button"
              className={filter === key ? "active" : ""}
              onClick={() => setFilter(key)}
              key={key}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="row-actions">
          <button
            className="icon-button"
            title="Preferencias"
            onClick={() => setSettings(!settings)}
          >
            <Settings2 size={15} />
          </button>
          <button
            className="icon-button"
            title="Refrescar"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await notificationsApi.refresh();
                await load(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            <RefreshCw size={15} />
          </button>
          <button
            className="secondary-button"
            disabled={!items.some((n) => !n.readAt)}
            onClick={async () => {
              await notificationsApi.readAll();
              await load(true);
            }}
          >
            <CheckCheck size={14} /> Marcar todas
          </button>
        </div>
      </div>
      {settings && (
        <div className="preference-grid">
          {Object.entries({
            stock: "Stock",
            services: "Servicios",
            movements: "Movimientos",
            expirations: "Vencimientos",
            purchases: "Compras",
          }).map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={prefs[key as keyof NotificationPreferences]}
                onChange={(e) =>
                  void savePrefs({ ...prefs, [key]: e.target.checked })
                }
              />
            </label>
          ))}
        </div>
      )}
      {error && <p className="form-error page-error">{error}</p>}
      <div className="notification-list">
        {visible.map((n) => (
          <button
            type="button"
            onClick={() => void read(n)}
            className={`notification-card ${n.readAt ? "" : "unread"} priority-${n.priority}`}
            key={n.id}
          >
            <span className="notification-symbol">
              <Bell size={15} />
            </span>
            <span>
              <strong>{n.title}</strong>
              <small>{n.message}</small>
              <time>{new Date(n.createdAt).toLocaleString("es-CL")}</time>
            </span>
            {!n.readAt && <i />}
          </button>
        ))}
        {!busy && !visible.length && (
          <div className="empty-state">
            No hay notificaciones en este filtro.
          </div>
        )}
        {busy && !items.length && (
          <div className="loading-state">Cargando notificaciones...</div>
        )}
      </div>
    </Modal>
  );
}
