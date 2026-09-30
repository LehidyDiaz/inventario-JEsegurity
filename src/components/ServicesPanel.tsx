import {
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { clientsApi, servicesApi, usersApi } from "../lib/resources";
import type {
  Client,
  ClientPayload,
  Service,
  ServicePayload,
  User,
} from "../types/inventory";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";
import { AttachmentsPanel } from "./AttachmentsPanel";

type Props = { canManage: boolean };
const emptyService = {
  title: "",
  clientId: "",
  location: "",
  scheduledAt: "",
  type: "Prevención",
  status: "Programado",
  notes: "",
  assignedUserIds: [] as number[],
};
const emptyClient = {
  name: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
};
const localDate = (value: string) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";
export function ServicesPanel({ canManage }: Props) {
  const [services, setServices] = useState<Service[]>([]),
    [clients, setClients] = useState<Client[]>([]),
    [users, setUsers] = useState<User[]>([]),
    [query, setQuery] = useState(""),
    [view, setView] = useState<"list" | "calendar">("list"),
    [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    [dayAgenda, setDayAgenda] = useState<Date | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState(emptyService),
    [editing, setEditing] = useState<Service | null>(null),
    [serviceDetail, setServiceDetail] = useState<Service | null>(null),
    [deleting, setDeleting] = useState<Service | null>(null),
    [open, setOpen] = useState(false),
    [clientsOpen, setClientsOpen] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClient),
    [clientEditing, setClientEditing] = useState<Client | null>(null),
    [clientOpen, setClientOpen] = useState(false),
    [clientDeleting, setClientDeleting] = useState<Client | null>(null);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, c, u] = await Promise.all([
        servicesApi.list(),
        clientsApi.list(),
        usersApi.list(),
      ]);
      setServices(s);
      setClients(c);
      setUsers(u);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar los servicios.",
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
      services.filter((s) =>
        `${s.title} ${s.client} ${s.location}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [services, query],
  );
  const openCreate = (date?: Date) => {
    setEditing(null);
    setForm({
      ...emptyService,
      clientId: clients[0] ? String(clients[0].id) : "",
      scheduledAt: date ? new Date(date.getFullYear(),date.getMonth(),date.getDate(),9).toISOString().slice(0,16) : "",
    });
    setError("");
    setOpen(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      title: s.title,
      clientId: s.clientId ? String(s.clientId) : "",
      location: s.location,
      scheduledAt: localDate(s.scheduledAt),
      type: s.type,
      status: s.status,
      notes: s.notes,
      assignedUserIds: s.assignedUserIds,
    });
    setOpen(true);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: ServicePayload = {
      title: form.title.trim(),
      clientId: form.clientId ? Number(form.clientId) : null,
      location: form.location.trim(),
      scheduledAt: form.scheduledAt,
      type: form.type,
      status: form.status,
      notes: form.notes.trim(),
      assignedUserIds: form.assignedUserIds,
    };
    setBusy(true);
    setError("");
    try {
      if (editing) await servicesApi.update(editing.id, payload);
      else await servicesApi.create(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await servicesApi.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  };
  const toggleUser = (id: number) =>
    setForm({
      ...form,
      assignedUserIds: form.assignedUserIds.includes(id)
        ? form.assignedUserIds.filter((v) => v !== id)
        : [...form.assignedUserIds, id],
    });
  const editClient = (c?: Client) => {
    setClientEditing(c ?? null);
    setClientForm(
      c
        ? {
            name: c.name,
            contact: c.contact,
            phone: c.phone,
            email: c.email,
            address: c.address,
          }
        : emptyClient,
    );
    setClientOpen(true);
  };
  const submitClient = async (e: FormEvent) => {
    e.preventDefault();
    const payload: ClientPayload = {
      ...clientForm,
      name: clientForm.name.trim(),
    };
    setBusy(true);
    setError("");
    try {
      if (clientEditing) await clientsApi.update(clientEditing.id, payload);
      else await clientsApi.create(payload);
      setClientOpen(false);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el cliente.",
      );
    } finally {
      setBusy(false);
    }
  };
  const removeClient = async () => {
    if (!clientDeleting) return;
    setBusy(true);
    try {
      await clientsApi.remove(clientDeleting.id);
      setClientDeleting(null);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo eliminar el cliente.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="module-view">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Servicios</p>
          <h1>Agenda y mantenimiento</h1>
          <p className="intro">
            Programación de inspecciones, capacitaciones y revisiones.
          </p>
        </div>
        <div className="heading-actions">
          {canManage && (
            <button
              className="secondary-button"
              onClick={() => setClientsOpen(true)}
            >
              <Users size={16} />
              Gestionar clientes
            </button>
          )}
          {canManage && (
            <button className="primary-button" onClick={() => openCreate()}>
              <Plus size={17} />
              Nuevo servicio
            </button>
          )}
        </div>
      </section>
      <div className="module-summary">
        <div>
          <strong>{services.length}</strong>
          <span>Servicios</span>
        </div>
        <div>
          <strong className="green-text">
            {services.filter((s) => s.status === "Programado").length}
          </strong>
          <span>Programados</span>
        </div>
        <div>
          <strong className="amber-text">
            {services.filter((s) => s.status === "En curso").length}
          </strong>
          <span>En curso</span>
        </div>
        <div>
          <strong className="red-text">
            {services.filter((s) => s.status === "Pendiente").length}
          </strong>
          <span>Pendientes</span>
        </div>
      </div>
      {error && !open && !clientOpen && (
        <p className="form-error page-error">{error}</p>
      )}
      <section className="panel inventory-panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar servicio, cliente o lugar..."
            />
          </div>
          <div className="toolbar-actions"><div className="segmented"><button className={view==='list'?'active':''} onClick={()=>setView('list')}><List size={14}/> Lista</button><button className={view==='calendar'?'active':''} onClick={()=>setView('calendar')}><CalendarDays size={14}/> Calendario</button></div></div>
        </div>
        {loading ? (
          <div className="loading-state">Cargando servicios...</div>
        ) : view === 'calendar' ? <ServiceCalendar services={filtered} month={month} setMonth={setMonth} canManage={canManage} onDay={setDayAgenda} onEvent={canManage ? openEdit : setServiceDetail}/> : (
          <div className="service-detailed-list">
            {filtered.map((s) => (
              <article className="service-card" key={s.id}>
                <div className="service-date-box">
                  <strong>{new Date(s.scheduledAt).getDate()}</strong>
                  <span>
                    {new Date(s.scheduledAt).toLocaleDateString("es-CL", {
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="service-card-content">
                  <div className="service-header-row">
                    <div>
                      <strong>{s.folio} · {s.title}</strong>
                      <span>{s.type}</span>
                    </div>
                    <span
                      className={`status-pill ${s.status === "Programado" || s.status === "Completado" ? "status-ok" : s.status === "En curso" ? "status-low" : "status-empty"}`}
                    >
                      <i />
                      {s.status}
                    </span>
                  </div>
                  <div className="service-meta">
                    <div>
                      <ShieldCheck size={14} />
                      {s.client}
                    </div>
                    <div>
                      <MapPin size={14} />
                      {s.location}
                    </div>
                    <div>
                      <Clock3 size={14} />
                      {new Date(s.scheduledAt).toLocaleString("es-CL")}
                    </div>
                    <div>
                      <UserRound size={14} />
                      {s.assignedTo.join(", ") || "Sin asignar"}
                    </div>
                  </div>
                  {s.notes && <p>{s.notes}</p>}
                  <div className="card-actions">
                      <button className="secondary-button" onClick={() => setServiceDetail(s)}><Eye size={14}/> Ver detalle</button>
                    {canManage && <>
                      <button
                        className="secondary-button"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        className="danger-button ghost"
                        onClick={() => setDeleting(s)}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && !filtered.length && (
          <div className="empty-state">No hay servicios para mostrar.</div>
        )}
        <div className="table-footer">
          <span>
            Mostrando {filtered.length} de {services.length} servicios
          </span>
        </div>
      </section>
      <Modal
        open={open}
        title={editing ? "Editar servicio" : "Nuevo servicio"}
        onClose={() => setOpen(false)}
        wide
      >
        <form className="product-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              <span>Título *</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              <span>Cliente *</span>
              <select
                required
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              >
                <option value="">Selecciona</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Ubicación *</span>
              <input
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
            <label>
              <span>Fecha y hora *</span>
              <input
                required
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) =>
                  setForm({ ...form, scheduledAt: e.target.value })
                }
              />
            </label>
            <label>
              <span>Tipo *</span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>Prevención</option>
                <option>Mantenimiento</option>
                <option>Capacitación</option>
              </select>
            </label>
            <label>
              <span>Estado *</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Programado</option>
                <option>En curso</option>
                <option>Pendiente</option>
                <option>Completado</option>
                <option>Cancelado</option>
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
          <fieldset className="checkbox-field">
            <legend>Equipo asignado</legend>
            <div className="checkbox-grid">
              {users.map((u) => (
                <label key={u.id}>
                  <input
                    type="checkbox"
                    checked={form.assignedUserIds.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                  />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {editing && <AttachmentsPanel entityType="services" entityId={editing.id} canDelete={canManage}/>}
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal open={Boolean(serviceDetail)} title={`${serviceDetail?.folio??''} · Detalle del servicio`} onClose={()=>setServiceDetail(null)} wide>
        {serviceDetail&&<><div className="detail-grid"><div><span>Cliente</span><strong>{serviceDetail.client}</strong></div><div><span>Tipo</span><strong>{serviceDetail.type}</strong></div><div><span>Estado</span><strong>{serviceDetail.status}</strong></div><div><span>Fecha</span><strong>{new Date(serviceDetail.scheduledAt).toLocaleString('es-CL')}</strong></div></div><div className="settings-row"><div><strong>{serviceDetail.location}</strong><span>{serviceDetail.assignedTo.join(', ')||'Sin equipo asignado'}</span></div></div>{serviceDetail.notes&&<p className="confirm-message">{serviceDetail.notes}</p>}<AttachmentsPanel entityType="services" entityId={serviceDetail.id} canDelete={canManage}/></>}
      </Modal>
      <Modal
        open={clientsOpen}
        title="Clientes"
        onClose={() => setClientsOpen(false)}
        wide
      >
        <div className="modal-toolbar">
          <p>Administra los clientes disponibles para los servicios.</p>
          <button className="primary-button" onClick={() => editClient()}>
            <Plus size={15} />
            Nuevo cliente
          </button>
        </div>
        <div className="settings-list">
          {clients.map((c) => (
            <div className="settings-row" key={c.id}>
              <div>
                <strong>{c.name}</strong>
                <span>
                  {c.contact} · {c.email} · {c.address}
                </span>
              </div>
              <div className="settings-actions">
                <button
                  className="icon-button"
                  onClick={() => editClient(c)}
                  aria-label="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button danger-icon"
                  onClick={() => setClientDeleting(c)}
                  aria-label="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {!clients.length && (
            <div className="empty-state">No hay clientes registrados.</div>
          )}
        </div>
      </Modal>
      <Modal
        open={clientOpen}
        title={clientEditing ? "Editar cliente" : "Nuevo cliente"}
        onClose={() => setClientOpen(false)}
      >
        <form className="product-form" onSubmit={submitClient}>
          <label>
            <span>Nombre *</span>
            <input
              required
              value={clientForm.name}
              onChange={(e) =>
                setClientForm({ ...clientForm, name: e.target.value })
              }
            />
          </label>
          <label>
            <span>Contacto</span>
            <input
              value={clientForm.contact}
              onChange={(e) =>
                setClientForm({ ...clientForm, contact: e.target.value })
              }
            />
          </label>
          <label>
            <span>Teléfono</span>
            <input
              value={clientForm.phone}
              onChange={(e) =>
                setClientForm({ ...clientForm, phone: e.target.value })
              }
            />
          </label>
          <label>
            <span>Correo</span>
            <input
              type="email"
              value={clientForm.email}
              onChange={(e) =>
                setClientForm({ ...clientForm, email: e.target.value })
              }
            />
          </label>
          <label>
            <span>Dirección</span>
            <textarea
              value={clientForm.address}
              onChange={(e) =>
                setClientForm({ ...clientForm, address: e.target.value })
              }
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setClientOpen(false)}
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
        message={`¿Eliminar el servicio ${deleting?.title ?? ""}?`}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
      <Modal open={Boolean(dayAgenda)} title={dayAgenda?.toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'})??'Agenda'} onClose={()=>setDayAgenda(null)}>
        {dayAgenda&&<><div className="agenda-list">{services.filter((s)=>sameDay(new Date(s.scheduledAt),dayAgenda)).map((s)=><button key={s.id} onClick={()=>{setDayAgenda(null);if(canManage)openEdit(s);else setServiceDetail(s)}}><time>{new Date(s.scheduledAt).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}</time><span><strong>{s.folio} · {s.title}</strong><small>{s.client} · {s.status}</small></span></button>)}{!services.some((s)=>sameDay(new Date(s.scheduledAt),dayAgenda))&&<div className="empty-state">No hay servicios este día.</div>}</div>{canManage&&<div className="form-actions"><button className="primary-button" onClick={()=>{const date=dayAgenda;setDayAgenda(null);openCreate(date)}}><Plus size={14}/> Crear servicio este día</button></div>}</>}
      </Modal>
      <ConfirmDialog
        open={Boolean(clientDeleting)}
        message={`¿Eliminar al cliente ${clientDeleting?.name ?? ""}?`}
        busy={busy}
        onCancel={() => setClientDeleting(null)}
        onConfirm={() => void removeClient()}
      />
    </div>
  );
}

const sameDay=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()
function ServiceCalendar({services,month,setMonth,canManage,onDay,onEvent}:{services:Service[];month:Date;setMonth:(d:Date)=>void;canManage:boolean;onDay:(d:Date)=>void;onEvent:(s:Service)=>void}){
  const first=new Date(month.getFullYear(),month.getMonth(),1),offset=(first.getDay()+6)%7,start=new Date(first);start.setDate(first.getDate()-offset);const days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d})
  return <div className="calendar-wrap"><div className="calendar-toolbar"><div><button className="icon-button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={15}/></button><button className="secondary-button" onClick={()=>setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1))}>Hoy</button><button className="icon-button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={15}/></button></div><strong>{month.toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</strong></div><div className="calendar-weekdays">{['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((x)=><span key={x}>{x}</span>)}</div><div className="calendar-grid">{days.map((day)=>{const events=services.filter((s)=>sameDay(new Date(s.scheduledAt),day));return <div className={`calendar-day ${day.getMonth()!==month.getMonth()?'adjacent':''} ${sameDay(day,new Date())?'today':''}`} key={day.toISOString()}><button className="calendar-date" onClick={()=>onDay(day)} aria-label={`Ver agenda ${day.toLocaleDateString('es-CL')}`}>{day.getDate()}</button>{events.slice(0,3).map((s)=><button key={s.id} className={`calendar-event type-${s.type.toLowerCase().replace('ó','o')}`} onClick={()=>onEvent(s)} title={`${s.folio} ${s.title}`}><span>{new Date(s.scheduledAt).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}</span> {s.title}</button>)}{events.length>3&&<button className="more-events" onClick={()=>onDay(day)}>+{events.length-3} más</button>}{canManage&&!events.length&&<button className="day-add" onClick={()=>onDay(day)}>+</button>}</div>})}</div><div className="mobile-agenda">{services.filter((s)=>new Date(s.scheduledAt).getMonth()===month.getMonth()&&new Date(s.scheduledAt).getFullYear()===month.getFullYear()).map((s)=><button key={s.id} onClick={()=>onEvent(s)}><time>{new Date(s.scheduledAt).toLocaleDateString('es-CL',{day:'numeric',month:'short'})}</time><span><strong>{s.folio} · {s.title}</strong><small>{s.client} · {s.status}</small></span></button>)}</div></div>
}
