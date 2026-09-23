# React + TypeScript + Vite

## Base de datos con Docker y MySQL

La base usa MySQL 8 en Docker. El archivo [`database/jesegurity_mysql.sql`](database/jesegurity_mysql.sql) crea la base `jesegurity`, sus tablas, relaciones y datos demo iniciales. La API PHP también se ejecuta en un contenedor Apache, por lo que no necesitas XAMPP.

### Instalación

1. Instala y abre Docker Desktop.
2. Copia `.env.example` como `.env.local`.
3. Ejecuta `docker compose up --build -d` desde la raíz del proyecto.
4. Espera unos segundos a que MySQL termine de inicializarse.
5. Ejecuta `npm.cmd install` y luego `npm.cmd run dev`.
6. Abre la URL que muestre Vite. La API estará disponible en `http://localhost:8080`.

### Acceso y permisos

El inicio de sesión se valida contra MySQL mediante `api/auth.php` y entrega un token firmado con expiración. El usuario administrador demo es:

- Correo: `admin@jesegurity.com`
- Contraseña: `123456`

Solo el rol `Administrador` puede crear, editar o eliminar categorías y ubicaciones. Las escrituras de productos requieren una sesión válida de Administrador o Supervisor. Los operadores pueden consultar el inventario, pero no crear, editar ni eliminar productos. Las consultas también requieren una sesión válida.

Para detener los contenedores ejecuta `docker compose down`. Para borrar también los datos locales de MySQL usa `docker compose down -v`.

### Tablas principales

- `roles`: catálogo de roles del sistema.
- `users`: personas que usan el sistema y equipo operativo.
- `categories`: categorías de inventario.
- `locations`: ubicaciones físicas del almacén.
- `products`: productos, SKU, existencias, mínimo y ubicación.
- `suppliers`: proveedores.
- `supplier_products`: relación entre proveedores y productos.
- `clients`: clientes de los servicios.
- `services`: agenda de inspecciones, mantenimientos y capacitaciones.
- `service_assignments`: personal asignado a cada servicio.
- `inventory_movements`: entradas, salidas y ajustes.
- `inventory_movement_items`: productos y cantidades de cada movimiento.

El módulo Inventario ya usa `api/products.php`: carga productos desde MySQL y persiste crear, editar y eliminar. Los demás módulos aún muestran sus datos demo y se conectarán de la misma manera, tabla por tabla.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
