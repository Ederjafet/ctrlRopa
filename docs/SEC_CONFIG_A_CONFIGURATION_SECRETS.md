# SEC-CONFIG-A - Limpieza de configuracion y secrets

## Objetivo

Cerrar el pendiente de alta prioridad `SEC-CONFIG-A` con un alcance seguro:

- auditar archivos de configuracion versionados;
- identificar secrets o valores sensibles hardcodeados;
- externalizar secrets fuera del repositorio;
- documentar variables de entorno esperadas;
- no cambiar logica funcional, endpoints, AUTH/RBAC ni reglas de negocio.

## Bloque seleccionado desde PROJECT-GOV-B

Se selecciono `SEC-CONFIG-A` porque:

- es P1/S1 en `PROJECT_BACKLOG_PRIORITIZED.md`;
- tiene alcance claro y controlado;
- no requiere backend nuevo;
- no mezcla pagos, LIVE, UI ni QA manual;
- reduce riesgo operativo sin cambiar contratos de API.

Pendientes P0 no seleccionados:

- `PRODUCT-D4 REAL`: requiere QA humano y evidencia manual.
- `LIVE-Z10B`: requiere decision de negocio y backend real de aprobaciones.
- `ITEM-Z1`: requiere definicion de permisos, auditoria y reglas de edicion.

## Archivos auditados

| Archivo | Hallazgo | Decision |
| --- | --- | --- |
| `backend/control-ropa/src/main/resources/application.properties` | Contenia datasource local con password versionado y rutas/logs fijos. | Externalizar variables sensibles y parametrizar valores operativos. |
| `.gitignore` | Ignoraba `.env*.local`, pero no `.env` ni `.env.*` generales. | Ignorar `.env` y `.env.*`, permitir ejemplos versionados. |
| `app.json` | Config Expo sin secretos detectados; contiene `projectId` y owner. | Mantener. |
| `eas.json` | Perfiles EAS sin secrets detectados. | Mantener. |
| `constants/api.ts` | Ya usa `EXPO_PUBLIC_*` para base URL/host/port. | Mantener; documentar en `.env.example`. |

## Cambios aplicados

### Backend

`application.properties` ahora usa variables de entorno:

| Variable | Uso | Default versionado |
| --- | --- | --- |
| `CONTROL_ROPA_SERVER_PORT` | Puerto backend | `8090` |
| `CONTROL_ROPA_DB_URL` | URL JDBC | Localhost QA/dev |
| `CONTROL_ROPA_DB_USERNAME` | Usuario DB | `root` |
| `CONTROL_ROPA_DB_PASSWORD` | Password DB | vacio |
| `SECURITY_AUDIT_RETENTION_DAYS` | Retencion auditoria | `180` |
| `SECURITY_AUDIT_CLEANUP_ENABLED` | Cleanup auditoria | `true` |
| `SECURITY_AUDIT_CLEANUP_CRON` | Cron cleanup | `0 0 3 * * *` |
| `CONTROL_ROPA_LOG_FILE` | Archivo log | ruta local |
| `CONTROL_ROPA_LOG_PATTERN` | Rolling log | ruta local |
| `CONTROL_ROPA_LOG_MAX_FILE_SIZE` | Tamano log | `20MB` |
| `CONTROL_ROPA_LOG_MAX_HISTORY` | Historial log | `30` |
| `CONTROL_ROPA_LOG_TOTAL_SIZE_CAP` | Cap log | `1GB` |

La variable `CONTROL_ROPA_DB_PASSWORD` no tiene secreto por default. Para ejecutar local/QA se debe definir en entorno, `.env` local no versionado o secret store de CI.

### Frontend

Se creo `.env.example` con variables publicas Expo:

- `EXPO_PUBLIC_API_PORT`;
- `EXPO_PUBLIC_API_HOST`;
- `EXPO_PUBLIC_API_BASE_URL`.

Estas variables son publicas por definicion de Expo. No deben contener secretos.

### Git hygiene

`.gitignore` ahora ignora:

- `.env`;
- `.env.*`;

y permite:

- `.env.example`;
- `*.env.example`.

## Reglas de despliegue seguro

1. Nunca commitear `.env` real.
2. Nunca usar passwords reales en `application.properties`.
3. Definir `CONTROL_ROPA_DB_PASSWORD` en entorno o secret store.
4. En produccion, definir `CONTROL_ROPA_DB_URL` con SSL/TLS segun infraestructura.
5. Revisar `allowPublicKeyRetrieval=true` y `useSSL=false`: son aceptables solo para local/dev controlado.
6. Mantener logs fuera del repo y con retencion definida.
7. No poner tokens, API keys ni client secrets en variables `EXPO_PUBLIC_*`.

## Validacion manual esperada

1. Configurar `CONTROL_ROPA_DB_PASSWORD` en el entorno local/QA.
2. Ejecutar backend y confirmar conexion DB.
3. Ejecutar app frontend con `EXPO_PUBLIC_API_HOST`/`EXPO_PUBLIC_API_PORT` o `EXPO_PUBLIC_API_BASE_URL`.
4. Confirmar que `.env` no aparece en `git status`.
5. Confirmar que `.env.example` si queda versionado.

## Estado

DONE_TECH para SEC-CONFIG-A.

Estado QA: PENDING_QA hasta validar arranque en ambiente QA/staging con variables reales configuradas fuera del repositorio.
