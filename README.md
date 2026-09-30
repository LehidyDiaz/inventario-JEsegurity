# React + TypeScript + Vite

## Laravel, Docker y MySQL

El backend principal está en [`backend`](backend) y usa Laravel 13 con MySQL 8.4. Docker construye PHP y las dependencias Composer, ejecuta las migraciones y aplica seeds idempotentes en cada arranque. El SQL de [`database`](database) y la API de [`api`](api) se conservan solo como referencia legacy y no se montan en MySQL.

### Instalación

1. Instala y abre Docker Desktop.
2. Ejecuta `docker compose up --build -d` desde la raíz del proyecto.
3. Espera a que `docker compose ps` muestre `mysql` y `api` como saludables.
4. Si usas el frontend Vite, configura `VITE_API_URL=http://localhost:8080/api` en su entorno.
5. Ejecuta `npm.cmd install` y luego `npm.cmd run dev`.
6. Abre la URL que muestre Vite. La API estará disponible en `http://localhost:8080/api` y el healthcheck en `http://localhost:8080/up`.

La cuenta inicial es `admin@jesegurity.com` con contraseña `123456`. Cambia esta credencial al preparar un entorno real.

Para detener los contenedores ejecuta `docker compose down`. Para recrear la base completamente desde las migraciones Laravel usa `docker compose down -v` y luego `docker compose up --build -d`. Este último comando elimina el volumen local y todos sus datos. Es necesario una vez si el volumen fue creado anteriormente mediante el SQL legacy, porque ese esquema no tiene historial de migraciones Laravel.

### API y pruebas

El login es `POST /api/login`; las rutas restantes usan `Authorization: Bearer <token>`. Los recursos REST son `products`, `categories`, `locations`, `suppliers`, `clients`, `services`, `users`, `roles` y `movements`.

La API ampliada incluye notificaciones y preferencias, auditoría, lotes/vencimientos, órdenes de compra con recepción transaccional, aprobación/rechazo de movimientos, folios anuales, trazabilidad, adjuntos privados, reportes JSON/CSV, perfil, búsqueda y recuperación de contraseña. El contrato completo y los comandos operativos están documentados en [`backend/README.md`](backend/README.md).

Para ejecutar los tests Feature dentro de Docker:

```bash
docker compose run --rm -e DB_CONNECTION=sqlite -e DB_DATABASE=:memory: api php artisan test
```

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

Las existencias cambian solo con movimientos `Confirmado`. Una entrada suma, una salida resta validando stock y un ajuste establece `quantity` como el nuevo stock del producto. Editar o borrar un movimiento confirmado revierte primero su impacto anterior dentro de la misma transacción.

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
