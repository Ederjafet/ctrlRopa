# LIVE-FIX-A - Acciones LIVE sin respuesta y validaciones accionables

## Contexto QA

QA reporto que algunas acciones visibles en `/live` no daban respuesta clara:

- `CAMBIAR POR PRENDA PREPARADA` cuando no habia prenda preparada.
- `Cerrar como venta LIVE` cuando la accion no podia continuar o faltaba una confirmacion visible dentro de la app.

## Alcance ejecutado

- Se corrigio el flujo de cambio por prenda preparada para mostrar aviso accionable cuando falta una prenda preparada.
- Se reemplazo la confirmacion nativa de `Cerrar como venta LIVE` por una confirmacion visual en la app.
- Se agregaron validaciones frontend antes de confirmar venta LIVE para estados locales no validos.
- Se agregaron claves i18n en ES, EN, PT-BR, FR, JA, ZH y KO.
- Se documento la fase en `docs/LIVE_FIX_A_ACTIONABLE_LIVE_BUTTONS.md`.

## Fuera de alcance

- No se modifico backend.
- No se crearon endpoints.
- No se tocaron pagos, caja ni reportes backend.
- No se cambiaron permisos, RBAC ni reglas profundas de LIVE.
- No se implemento WebSocket/SSE.

## Validaciones ejecutadas

- `npm.cmd run lint`: PASS con 53 warnings preexistentes del repositorio y 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `backend/control-ropa/./mvnw.cmd test`: PASS tras cargar `.env` local sin imprimir secretos.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: PASS tras cargar `.env` local sin imprimir secretos.
- `git --no-pager diff --check`: PASS.

Notas de entorno:

- El primer intento de Maven fallo porque `CONTROL_ROPA_DB_PASSWORD` no estaba cargado en el proceso.
- El segundo intento cargo `.env`, pero conservo comillas simples de la URL local y Maven rechazo el JDBC URL.
- El tercer intento removio comillas simples/dobles solo en memoria y Maven test paso.
- Durante Maven test aparecio ruido de logback por ruta local de logs sin permiso; no bloqueo la ejecucion.

## Validacion manual esperada

1. Abrir `/live` como admin/operador.
2. Tener prenda al aire sin prenda preparada.
3. Presionar `CAMBIAR POR PRENDA PREPARADA`.
4. Confirmar aviso accionable.
5. Preparar una prenda distinta.
6. Presionar `CAMBIAR POR PRENDA PREPARADA`.
7. Confirmar que la prenda preparada pasa al aire.
8. Presionar `Cerrar como venta LIVE` en un apartado elegible.
9. Confirmar modal visual de venta LIVE.
10. Confirmar que el texto aclara que no registra pago ni caja.
11. Validar light/dark y mobile/tablet.

## Estado

- Estado tecnico inicial: cambios implementados.
- Estado QA: PENDING_QA.
