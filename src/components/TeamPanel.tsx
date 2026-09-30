import {
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { rolesApi } from "../lib/catalogApi";
import { usersApi } from "../lib/resources";
import type { Role, User, UserPayload } from "../types/inventory";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";

const empty = {
  name: "",
  email: "",
  password: "",
  roleId: "",
  phone: "",
  department: "",
  location: "",
  status: "Disponible",
  shift: "Turno A",
  rating: "0",
  skills: "",
  nextAssignment: "",
};
export function TeamPanel() {
  const [users, setUsers] = useState<User[]>([]),
    [roles, setRoles] = useState<Role[]>([]),
    [form, setForm] = useState(empty),
    [query, setQuery] = useState(""),
    [roleFilter, setRoleFilter] = useState("");
  const [editing, setEditing] = useState<User | null>(null),
    [deleting, setDeleting] = useState<User | null>(null),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [u, r] = await Promise.all([usersApi.list(), rolesApi.list()]);
      setUsers(u);
      setRoles(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el equipo.");
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
      users.filter(
        (u) =>
          (!roleFilter || String(u.roleId) === roleFilter) &&
          `${u.name} ${u.role} ${u.department} ${u.location}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [users, query, roleFilter],
  );
  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, roleId: roles[0] ? String(roles[0].id) : "" });
    setError("");
    setOpen(true);
  };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      roleId: String(u.roleId),
      phone: u.phone,
      department: u.department,
      location: u.location,
      status: u.status,
      shift: u.shift,
      rating: String(u.rating),
      skills: u.skills.join(", "),
      nextAssignment: u.nextAssignment,
    });
    setOpen(true);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing && !form.password) {
      setError("La contraseña es obligatoria al crear un usuario.");
      return;
    }
    const payload: UserPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      roleId: Number(form.roleId),
      phone: form.phone.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      status: form.status,
      shift: form.shift,
      rating: Number(form.rating),
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      nextAssignment: form.nextAssignment.trim(),
      ...(form.password ? { password: form.password } : {}),
    };
    setBusy(true);
    setError("");
    try {
      if (editing) await usersApi.update(editing.id, payload);
      else await usersApi.create(payload);
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
      await usersApi.remove(deleting.id);
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
          <p className="eyebrow">Equipo</p>
          <h1>Personal operativo</h1>
          <p className="intro">
            Usuarios, disponibilidad, capacidades y turnos.
          </p>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={17} />
          Agregar miembro
        </button>
      </section>
      <div className="module-summary">
        <div>
          <strong>{users.length}</strong>
          <span>Personal total</span>
        </div>
        <div>
          <strong className="green-text">
            {users.filter((u) => u.status === "Disponible").length}
          </strong>
          <span>Disponibles</span>
        </div>
        <div>
          <strong className="amber-text">
            {users.filter((u) => u.status === "En campo").length}
          </strong>
          <span>En campo</span>
        </div>
        <div>
          <strong className="red-text">
            {users.filter((u) => u.status === "Capacitación").length}
          </strong>
          <span>Capacitación</span>
        </div>
      </div>
      {error && !open && <p className="form-error page-error">{error}</p>}
      <section className="panel inventory-panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empleado o área..."
            />
          </div>
          <div className="toolbar-actions">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Todos los roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">Cargando equipo...</div>
        ) : (
          <div className="team-grid">
            {filtered.map((u) => (
              <article className="team-card" key={u.id}>
                <div className="team-card-head">
                  <div className="team-avatar">
                    {u.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <strong>{u.name}</strong>
                    <span>{u.role}</span>
                  </div>
                  <span
                    className={`status-pill ${u.status === "Disponible" ? "status-ok" : u.status === "En campo" ? "status-low" : "status-empty"}`}
                  >
                    <i />
                    {u.status}
                  </span>
                </div>
                <div className="team-meta-row">
                  <div>
                    <small>Departamento</small>
                    <strong>{u.department || "Sin departamento"}</strong>
                  </div>
                  <div className="rating-box">
                    <Star size={12} fill="currentColor" />
                    {Number(u.rating).toFixed(1)}
                  </div>
                </div>
                <div className="team-details">
                  <div>
                    <MapPin size={14} />
                    {u.location || "Sin ubicación"}
                  </div>
                  <div>
                    <ShieldCheck size={14} />
                    {u.shift}
                  </div>
                  <div>
                    <Phone size={14} />
                    {u.phone || "Sin teléfono"}
                  </div>
                  <div>
                    <Mail size={14} />
                    {u.email}
                  </div>
                </div>
                <div className="team-skills">
                  {u.skills.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <div className="team-footer">
                  <span>
                    Próxima asignación: {u.nextAssignment || "Sin asignar"}
                  </span>
                </div>
                <div className="card-actions">
                  <button
                    className="secondary-button"
                    onClick={() => openEdit(u)}
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    className="danger-button ghost"
                    onClick={() => setDeleting(u)}
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && !filtered.length && (
          <div className="empty-state">No hay usuarios para mostrar.</div>
        )}
        <div className="table-footer">
          <span>
            Mostrando {filtered.length} de {users.length} colaboradores
          </span>
        </div>
      </section>
      <Modal
        open={open}
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        onClose={() => setOpen(false)}
        wide
      >
        <form className="product-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              <span>Nombre *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              <span>Correo *</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              <span>Contraseña {editing ? "(opcional)" : "*"}</span>
              <input
                required={!editing}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <label>
              <span>Rol *</span>
              <select
                required
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              >
                <option value="">Selecciona</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Teléfono</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              <span>Departamento</span>
              <input
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </label>
            <label>
              <span>Ubicación</span>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
            <label>
              <span>Estado</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Disponible</option>
                <option>En campo</option>
                <option>Capacitación</option>
                <option>Inactivo</option>
              </select>
            </label>
            <label>
              <span>Turno</span>
              <select
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
              >
                <option>Turno A</option>
                <option>Turno B</option>
              </select>
            </label>
            <label>
              <span>Calificación</span>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              />
            </label>
            <label>
              <span>Habilidades (separadas por coma)</span>
              <input
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />
            </label>
            <label>
              <span>Próxima asignación</span>
              <input
                value={form.nextAssignment}
                onChange={(e) =>
                  setForm({ ...form, nextAssignment: e.target.value })
                }
              />
            </label>
          </div>
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
      <ConfirmDialog
        open={Boolean(deleting)}
        message={`¿Eliminar a ${deleting?.name ?? "este usuario"}?`}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
