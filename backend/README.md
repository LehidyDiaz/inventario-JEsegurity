# JESegurity API

API Laravel 13 para inventario, servicios, compras, trazabilidad y operación de seguridad. Todas las respuestas de negocio usan propiedades `camelCase`; la base de datos conserva nombres `snake_case`.

## Ejecución

Desde la raíz del repositorio:

```bash
docker compose up --build -d
docker compose run --rm -e DB_CONNECTION=sqlite -e DB_DATABASE=:memory: api php artisan test
```

El contenedor aplica migraciones aditivas, ejecuta el seed idempotente y genera notificaciones diarias sin duplicados al arrancar. La API queda en `http://localhost:8080/api`.

## Autenticación y perfil

- `POST /api/login`, `GET /api/me`, `POST /api/logout`
- `POST /api/forgot-password`, `POST /api/reset-password`
- `GET|PUT /api/profile`
- `GET /api/search?q=texto`

La recuperación guarda solo el hash del token durante 60 minutos. En local el token se envía mediante el mailer `log`; nunca forma parte de la respuesta HTTP.

## Operación

- Notificaciones: `GET /notifications`, `PATCH /notifications/{id}/read`, `POST /notifications/read-all`, `POST /notifications/refresh`
- Preferencias: `GET|PUT /notification-preferences`
- Lotes: `GET|POST /product-batches`, `GET|PUT|DELETE /product-batches/{id}`, `GET /expirations/summary`
- Compras: CRUD en `/purchase-orders`, además de `POST /{id}/send`, `POST /{id}/approve` y `POST /{id}/receive`
- Movimientos: CRUD en `/movements`, además de `POST /{id}/approve` y `POST /{id}/reject`
- Trazabilidad y etiqueta: `GET /products/{id}/trace`, `GET /products/{id}/label`
- Adjuntos: `POST /attachments` multipart (`entityType`, `entityId`, `file`), `GET /attachments`, `GET /attachments/{id}/download`, `DELETE /attachments/{id}`
- Auditoría: `GET /audit-logs?action=&userId=&auditableType=&from=&to=`
- Reportes: `GET /reports/dashboard`, `/inventory`, `/movements`, `/services`, `/suppliers`
- CSV: `GET /reports/{inventory|movements|services|suppliers}/csv?from=&to=`

Los folios `MOV`, `SRV` y `OC` se generan por año mediante secuencias bloqueadas. La recepción de compras y la aprobación de movimientos bloquean orden, movimiento y productos, validan cantidades y modifican stock en una sola transacción.

## Permisos

- `Administrador`: acceso total.
- `Supervisor`: operación, compras, lotes, reportes y auditoría.
- `Operador`: lectura y creación de movimientos, siempre en estado `Pendiente`.
- `Técnico` e `Inspector`: lectura de recursos y servicios; pueden adjuntar evidencia.

## Comandos

```bash
php artisan notifications:generate
php artisan app:backup-database
php artisan app:backup-database --output=/ruta/segura/respaldo.sql
```

`notifications:generate` es idempotente por usuario, tipo, recurso y día. `app:backup-database` no tiene endpoint HTTP, solo se ejecuta explícitamente, exige conexión MySQL y utiliza `mysqldump`; los respaldos por defecto quedan en `storage/app/backups`.
