# PRODUCT-ERR-A - Reporte QA tecnico

Fecha: 2026-06-07 14:07:32
Rama: `feature/product-err-a-actionable-errors`

## Alcance

Se estandarizo el manejo de errores frontend para evitar mensajes genericos o tecnicos visibles al usuario, especialmente `Ocurrio un error interno inesperado`.

## Pantallas cubiertas

- `/door-reservation`
- `/door-sale`
- `/live`
- `/items-create`
- `/customers`
- `/reservations`
- `/users`

## Cambios verificados tecnicamente

- `services/apiError.ts` clasifica conexion, timeout, sesion, permisos, no encontrado, conflicto, validacion, interno y desconocido.
- `services/apiClient.ts` actualiza fallback local para pantallas pendientes.
- Las pantallas criticas usan mensajes accionables en vez de `err.message` directo.
- `customers` muestra panel inline con reintento ante error de carga.
- LIVE mantiene titulos operativos y cambia el cuerpo del error a copia segura.
- Se agregaron claves `errors.*` en `es`, `en`, `pt-BR`, `fr`, `ja`, `zh`, `ko`.

## Pendientes documentados

Quedan modulos no prioritarios con usos de `err.message` directo: transfers, consignaciones, shipments, refunds, reportes y caja. Se recomienda PRODUCT-ERR-B por dominio.

## Validaciones ejecutadas

- `npx.cmd tsc --noEmit`: PASS
- `npm.cmd run lint`: PASS, con warnings preexistentes del repositorio.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS
- `backend/control-ropa/.\\mvnw.cmd test`: PASS, 73 tests.
- `backend/control-ropa/.\\mvnw.cmd -q -DskipTests package`: PASS
- `git --no-pager diff --check`: PASS
