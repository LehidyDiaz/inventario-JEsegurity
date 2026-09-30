import {
  ArrowUp,
  Bell,
  ChevronDown,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import "./App.css";
import { AuditLogPanel } from "./components/AuditLogPanel";
import { Dashboard } from "./components/Dashboard";
import { ExpirationsPanel } from "./components/ExpirationsPanel";
import { InventoryTable } from "./components/InventoryTable";
import { Modal } from "./components/Modal";
import { MovementsPanel } from "./components/MovementsPanel";
import { NotificationsCenter } from "./components/NotificationsCenter";
import { PurchaseOrdersPanel } from "./components/PurchaseOrdersPanel";
import { ReportsPanel } from "./components/ReportsPanel";
import { ServicesPanel } from "./components/ServicesPanel";
import { Sidebar, type Section } from "./components/Sidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { SuppliersPanel } from "./components/SuppliersPanel";
import { TeamPanel } from "./components/TeamPanel";
import {
  forgotPassword,
  getProfile,
  login,
  logout,
  resetPassword,
  restoreSession,
  tokenStore,
  updateProfile,
} from "./lib/authApi";
import { operationsApi } from "./lib/operationsApi";
import type { AuthUser, SearchResult } from "./types/inventory";
const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const hasStoredSession = Boolean(tokenStore.get());
const sectionMap: Record<SearchResult["section"], Section> = {
  products: "Inventario",
  services: "Servicios",
  suppliers: "Proveedores",
  clients: "Servicios",
  users: "Equipo",
};
function App() {
  const [activeSection, setActiveSection] = useState<Section>("Inicio"),
    [sidebarOpen, setSidebarOpen] = useState(false),
    [authLoading, setAuthLoading] = useState(hasStoredSession),
    [loginBusy, setLoginBusy] = useState(false),
    [credentials, setCredentials] = useState({ email: "", password: "" }),
    [loginError, setLoginError] = useState(""),
    [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false),
    [unread, setUnread] = useState(0),
    [profileOpen, setProfileOpen] = useState(false),
    [helpOpen, setHelpOpen] = useState(false),
    [forgotOpen, setForgotOpen] = useState(false),
    [resetMode, setResetMode] = useState(false),
    [message, setMessage] = useState(""),
    [profile, setProfile] = useState({
      name: "",
      phone: "",
      department: "",
      location: "",
      shift: "",
      currentPassword: "",
      password: "",
      password_confirmation: "",
    });
  const [search, setSearch] = useState(""),
    [results, setResults] = useState<SearchResult[]>([]),
    [searching, setSearching] = useState(false),
    [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!hasStoredSession) return;
    restoreSession()
      .then(setCurrentUser)
      .catch(() => tokenStore.clear())
      .finally(() => setAuthLoading(false));
  }, []);
  useEffect(() => {
    const expired = () => setCurrentUser(null);
    window.addEventListener("jesegurity:session-expired", expired);
    return () =>
      window.removeEventListener("jesegurity:session-expired", expired);
  }, []);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        if (search.trim().length < 2) {
          setResults([]);
          setSearchOpen(false);
          return;
        }
        setSearching(true);
        operationsApi
          .search(search.trim())
          .then((r) => {
            setResults(r);
            setSearchOpen(true);
          })
          .catch(() => setResults([]))
          .finally(() => setSearching(false));
      },
      search.trim().length < 2 ? 0 : 300,
    );
    return () => window.clearTimeout(timer);
  }, [search]);
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    try {
      setCurrentUser(
        await login(
          credentials.email.trim().toLowerCase(),
          credentials.password,
        ),
      );
      setActiveSection("Inicio");
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión.",
      );
    } finally {
      setLoginBusy(false);
    }
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setCredentials({ email: "", password: "" });
    setActiveSection("Inicio");
    void logout();
  };
  const openProfile = async () => {
    setMessage("");
    try {
      const u = await getProfile();
      setProfile({
        name: u.name,
        phone: u.phone,
        department: u.department,
        location: u.location,
        shift: u.shift,
        currentPassword: "",
        password: "",
        password_confirmation: "",
      });
      setProfileOpen(true);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "No se pudo cargar el perfil.",
      );
    }
  };
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setMessage("");
    try {
      const body: Record<string, string> = {
        name: profile.name,
        phone: profile.phone,
        department: profile.department,
        location: profile.location,
        shift: profile.shift,
      };
      if (profile.password) {
        body.currentPassword = profile.currentPassword;
        body.password = profile.password;
        body.password_confirmation = profile.password_confirmation;
      }
      const user = await updateProfile(body);
      setCurrentUser(user);
      setProfileOpen(false);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "No se pudo guardar el perfil.",
      );
    } finally {
      setLoginBusy(false);
    }
  };
  if (authLoading)
    return (
      <div className="session-loading">
        <ShieldCheck size={30} />
        <strong>Restaurando sesión...</strong>
      </div>
    );
  if (!currentUser)
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-mark">
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong>JESegurity</strong>
              <span>Gestión operativa</span>
            </div>
          </div>
          <div className="login-header">
            <div className="login-icon">
              <LockKeyhole size={22} />
            </div>
            <h1>
              {resetMode ? "Restablecer contraseña" : "Acceso al sistema"}
            </h1>
            <p>
              {resetMode
                ? "Usa el token recibido por correo. En desarrollo se registra en el log del contenedor y nunca se muestra aquí."
                : "Ingresa tus credenciales para continuar."}
            </p>
          </div>
          {resetMode ? (
            <ResetForm
              busy={loginBusy}
              initialEmail={credentials.email}
              onCancel={() => setResetMode(false)}
              onSubmit={async (body) => {
                setLoginBusy(true);
                try {
                  const response = await resetPassword(body);
                  setMessage(response.message);
                  setResetMode(false);
                } catch (e) {
                  setLoginError(
                    e instanceof Error ? e.message : "No se pudo restablecer.",
                  );
                } finally {
                  setLoginBusy(false);
                }
              }}
            />
          ) : (
            <form className="login-form" onSubmit={handleLogin}>
              <label>
                <span>Correo electrónico</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials({ ...credentials, email: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Contraseña</span>
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                />
              </label>
              {loginError && <p className="login-error">{loginError}</p>}
              {message && <p className="success-message">{message}</p>}
              <button
                className="primary-button login-button"
                disabled={loginBusy}
              >
                {loginBusy ? "Ingresando..." : "Entrar al sistema"}
              </button>
              <button
                className="text-button forgot-link"
                type="button"
                onClick={() => setForgotOpen(true)}
              >
                Olvidé mi contraseña
              </button>
            </form>
          )}
        </div>
        <Modal
          open={forgotOpen}
          title="Recuperar contraseña"
          onClose={() => setForgotOpen(false)}
        >
          <form
            className="product-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoginBusy(true);
              try {
                const r = await forgotPassword(credentials.email);
                setMessage(
                  `${r.message} En desarrollo, revisa el log de correo del contenedor.`,
                );
                setForgotOpen(false);
                setResetMode(true);
              } catch (err) {
                setLoginError(
                  err instanceof Error
                    ? err.message
                    : "No se pudo solicitar la recuperación.",
                );
              } finally {
                setLoginBusy(false);
              }
            }}
          >
            <p className="confirm-message">
              Ingresa tu correo. La respuesta no confirma si la cuenta existe.
            </p>
            <label>
              <span>Correo *</span>
              <input
                required
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
              />
            </label>
            <div className="form-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setForgotOpen(false)}
              >
                Cancelar
              </button>
              <button className="primary-button" disabled={loginBusy}>
                Solicitar
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  const isAdmin = currentUser.role === "Administrador",
    canSupervise = isAdmin || currentUser.role === "Supervisor",
    canMove = canSupervise || currentUser.role === "Operador";
  const navigate = (s: Section) => {
    setActiveSection(s);
    setSidebarOpen(false);
  };
  return (
    <div className="app-shell">
      <div
        className={`mobile-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className={sidebarOpen ? "sidebar-mobile-open" : ""}>
        <Sidebar
          activeSection={activeSection}
          onSectionChange={navigate}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          canSupervise={canSupervise}
          currentUser={currentUser}
          unreadCount={unread}
          onNotifications={() => setNotificationsOpen(true)}
          onHelp={() => setHelpOpen(true)}
          onProfile={() => void openProfile()}
        />
      </div>
      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>JESegurity</span>
            <ChevronDown size={14} />
            <strong>{activeSection}</strong>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={17} />
              <input
                ref={searchRef}
                value={search}
                onFocus={() => search.length >= 2 && setSearchOpen(true)}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en el sistema..."
                aria-label="Buscar en el sistema"
              />
              <kbd>Ctrl K</kbd>
              {searchOpen && (
                <div className="search-results">
                  {searching ? (
                    <div className="empty-state">Buscando...</div>
                  ) : results.length ? (
                    (
                      [
                        "products",
                        "services",
                        "suppliers",
                        "clients",
                        "users",
                      ] as SearchResult["section"][]
                    ).map((group) => {
                      const entries = results.filter(
                        (r) => r.section === group,
                      );
                      return entries.length ? (
                        <section key={group}>
                          <strong>
                            {
                              (
                                {
                                  products: "Productos",
                                  services: "Servicios",
                                  suppliers: "Proveedores",
                                  clients: "Clientes",
                                  users: "Equipo",
                                } as Record<SearchResult["section"], string>
                              )[group]
                            }
                          </strong>
                          {entries.map((r) => (
                            <button
                              key={`${r.section}-${r.id}`}
                              onClick={() => {
                                navigate(sectionMap[r.section]);
                                setSearch("");
                                setSearchOpen(false);
                              }}
                            >
                              <span>{r.title}</span>
                              <small>{r.subtitle}</small>
                            </button>
                          ))}
                        </section>
                      ) : null;
                    })
                  ) : (
                    <div className="empty-state">Sin resultados.</div>
                  )}
                </div>
              )}
            </div>
            <button
              className="topbar-icon"
              onClick={() => setNotificationsOpen(true)}
              aria-label={`Notificaciones, ${unread} no leídas`}
            >
              <Bell size={19} />
              {unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
            </button>
            <button
              className="topbar-profile"
              onClick={() => void openProfile()}
            >
              <div className="profile-avatar small">
                {initials(currentUser.name)}
              </div>
              <span>{currentUser.name}</span>
            </button>
          </div>
        </header>
        {activeSection === "Inicio" ? (
          <Dashboard
            currentUser={currentUser}
            canSupervise={canSupervise}
            onNavigate={navigate}
          />
        ) : activeSection === "Inventario" ? (
          <InventoryTable canManageProducts={canSupervise} />
        ) : activeSection === "Movimientos" ? (
          <MovementsPanel
            canManage={canMove}
            canApprove={canSupervise}
            canEdit={canSupervise}
          />
        ) : activeSection === "Proveedores" ? (
          <SuppliersPanel canManage={canSupervise} />
        ) : activeSection === "Servicios" ? (
          <ServicesPanel canManage={canSupervise} />
        ) : activeSection === "Compras" && canSupervise ? (
          <PurchaseOrdersPanel />
        ) : activeSection === "Vencimientos" ? (
          <ExpirationsPanel canManage={canSupervise} />
        ) : activeSection === "Reportes" && canSupervise ? (
          <ReportsPanel />
        ) : activeSection === "Auditoría" && canSupervise ? (
          <AuditLogPanel />
        ) : activeSection === "Equipo" && isAdmin ? (
          <TeamPanel />
        ) : activeSection === "Configuración" && isAdmin ? (
          <SettingsPanel />
        ) : (
          <section className="coming-soon">
            <h1>Acceso restringido</h1>
            <p>No tienes permisos para administrar este módulo.</p>
            <button
              className="secondary-button"
              onClick={() => navigate("Inicio")}
            >
              Volver al inicio
            </button>
          </section>
        )}
        <NotificationsCenter
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          onNavigate={navigate}
          onUnread={setUnread}
        />
        <Modal
          open={profileOpen}
          title="Mi perfil"
          onClose={() => setProfileOpen(false)}
        >
          <form className="product-form" onSubmit={saveProfile}>
            <div className="form-grid">
              <label>
                <span>Nombre *</span>
                <input
                  required
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Teléfono</span>
                <input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Departamento</span>
                <input
                  value={profile.department}
                  onChange={(e) =>
                    setProfile({ ...profile, department: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Ubicación</span>
                <input
                  value={profile.location}
                  onChange={(e) =>
                    setProfile({ ...profile, location: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Turno</span>
                <select
                  value={profile.shift}
                  onChange={(e) =>
                    setProfile({ ...profile, shift: e.target.value })
                  }
                >
                  <option value="">Sin turno</option>
                  <option>Turno A</option>
                  <option>Turno B</option>
                </select>
              </label>
            </div>
            <div className="form-divider">Cambiar contraseña (opcional)</div>
            <label>
              <span>Contraseña actual</span>
              <input
                type="password"
                autoComplete="current-password"
                value={profile.currentPassword}
                onChange={(e) =>
                  setProfile({ ...profile, currentPassword: e.target.value })
                }
              />
            </label>
            <div className="form-grid">
              <label>
                <span>Nueva contraseña</span>
                <input
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={profile.password}
                  onChange={(e) =>
                    setProfile({ ...profile, password: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Confirmar contraseña</span>
                <input
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={profile.password_confirmation}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      password_confirmation: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            {message && <p className="form-error">{message}</p>}
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setProfileOpen(false)}
              >
                Cancelar
              </button>
              <button className="primary-button" disabled={loginBusy}>
                Guardar perfil
              </button>
            </div>
          </form>
        </Modal>
        <Modal
          open={helpOpen}
          title="Centro de ayuda"
          onClose={() => setHelpOpen(false)}
        >
          <div className="help-content">
            <p>
              <strong>Inventario:</strong> consulta existencias, trazabilidad,
              etiquetas y escanea SKU.
            </p>
            <p>
              <strong>Operación:</strong> registra movimientos con evidencia;
              supervisión aprueba o rechaza pendientes.
            </p>
            <p>
              <strong>Servicios:</strong> agenda inspecciones, mantenimiento y
              capacitaciones para clientes.
            </p>
            <p>
              <strong>Alertas:</strong> revisa la campana para stock, servicios,
              compras y vencimientos.
            </p>
          </div>
        </Modal>
        <button
          className="scroll-top-button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Subir arriba"
        >
          <ArrowUp size={18} />
        </button>
      </main>
    </div>
  );
}
function ResetForm({
  busy,
  initialEmail,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  initialEmail: string;
  onCancel: () => void;
  onSubmit: (body: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) => void;
}) {
  const [form, setForm] = useState({
    email: initialEmail,
    token: "",
    password: "",
    password_confirmation: "",
  });
  return (
    <form
      className="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <label>
        <span>Correo</span>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>
      <label>
        <span>Token</span>
        <input
          required
          autoComplete="one-time-code"
          value={form.token}
          onChange={(e) => setForm({ ...form, token: e.target.value })}
        />
      </label>
      <label>
        <span>Nueva contraseña</span>
        <input
          required
          minLength={8}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </label>
      <label>
        <span>Confirmación</span>
        <input
          required
          minLength={8}
          type="password"
          value={form.password_confirmation}
          onChange={(e) =>
            setForm({ ...form, password_confirmation: e.target.value })
          }
        />
      </label>
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Volver
        </button>
        <button className="primary-button" disabled={busy}>
          Restablecer
        </button>
      </div>
    </form>
  );
}
export default App;
