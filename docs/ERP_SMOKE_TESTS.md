# ERP - Smoke tests

Fecha: 2026-05-12

## Antes de release

| ID | Prueba | Prioridad | Bloquea release |
|---|---|---|---|
| `SMK-LOGIN-01` | Login valido, logout, login invalido. | CRITICA | Si |
| `SMK-DASH-01` | Dashboard carga indicadores y detalle. | ALTA | Si |
| `SMK-CUS-01` | Buscar cliente y abrir detalle. | ALTA | Si |
| `SMK-INV-01` | Buscar prenda y abrir detalle. | ALTA | Si |
| `SMK-BAT-01` | Abrir lote y validar estado/proveedor/calidad. | ALTA | Si |
| `SMK-LIVE-01` | Abrir live, seleccionar live, validar faltantes. | ALTA | Si |
| `SMK-SALE-01` | Venta puerta con validaciones y venta de prueba controlada. | CRITICA | Si |
| `SMK-PAY-01` | Pago controlado y validacion de faltantes. | CRITICA | Si |
| `SMK-PKG-01` | Abrir paquete y validar prendas. | ALTA | Si |
| `SMK-SHP-01` | Abrir envio y validar paquetes/estado. | ALTA | Si |
| `SMK-REP-01` | Ejecutar reporte diario/historico. | MEDIA | No, salvo error 500. |
| `SMK-SEC-01` | Usuario sin permiso recibe acceso denegado amigable. | CRITICA | Si |

## Post-release rapido

1. Validar `/api/health`.
2. Login con usuario operativo.
3. Dashboard.
4. Venta/reserva no destructiva o prueba controlada.
5. Pago solo si hay dato QA.
6. Reporte diario.
7. Revisar logs backend.

## Checklist operacional

- No hay pantalla roja en mobile/web.
- No hay `Error HTTP`, stack trace o URL tecnica visible.
- Botones criticos responden o explican faltante.
- Usuario sin permiso no ejecuta accion.
- Logs backend no muestran errores nuevos.
- No hay migraciones inesperadas.

## Validaciones criticas web/mobile

Web:

- Layout no tapa botones.
- Modales cierran correctamente.
- Listas largas son navegables.

Mobile:

- Botones principales caben en pantalla.
- Modales son legibles.
- Error 401/403 es amigable.
- API apunta al host correcto del ambiente.

