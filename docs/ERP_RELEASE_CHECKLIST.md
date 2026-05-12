# ERP - Release checklist

## Pre-release

### Git

- Confirmar rama: `git branch --show-current`.
- Confirmar estado: `git status --short`.
- No liberar con archivos no rastreados salvo justificacion documentada.
- Revisar diff: `git diff --stat` y `git diff`.
- Confirmar base actualizada contra `develop`.

### Alcance

- Confirmar fase y objetivo.
- Confirmar fuera de alcance.
- Confirmar que no hay cambios accidentales en pagos, live, lotes, seguridad o base de datos.
- Confirmar si hay migraciones. Si no debe haber, validar que `backend/control-ropa/src/main/resources/db/migration` no cambio.

### Datos y evidencia QA

- Confirmar dataset aplicable: `docs/ERP_QA_DATASET.md`.
- Confirmar usuarios por rol: `docs/ERP_QA_USERS_ROLES.md`.
- Confirmar plantilla de evidencia: `docs/ERP_QA_EVIDENCE_TEMPLATE.md`.
- Confirmar estandar de evidencia: `docs/ERP_EVIDENCE_STANDARD.md`.
- Confirmar bitacora de ejecucion: `docs/ERP_QA_EXECUTION_LOG.md`.
- Para primera corrida controlada, seguir `docs/ERP_QA_RUNBOOK_1E.md`.
- No aprobar release si un flujo critico queda sin datos QA y sin justificacion.

### Severidades y known issues

- Revisar severidades abiertas contra `docs/ERP_DEFECT_SEVERITY.md`.
- Confirmar que no exista `SEV-1` abierto.
- Confirmar que todo `SEV-2` tenga workaround aprobado o este cerrado.
- Revisar `docs/ERP_KNOWN_ISSUES.md`.
- Confirmar que known issues aceptados no afecten dinero, seguridad ni datos.

### Release candidate

- Confirmar politica RC: `docs/ERP_RELEASE_CANDIDATE_POLICY.md`.
- Confirmar flujos criticos: `docs/ERP_CRITICAL_FLOWS.md`.
- Confirmar que el build candidato esta congelado.
- Confirmar aprobacion QA Director/Release Manager si aplica.

### Backup

- Si hay migracion o cambio de datos: backup obligatorio de base.
- Si se ejecutan scripts QA, backup obligatorio aunque no haya cambio productivo.
- Si no hay cambio de datos: registrar "no aplica".
- Guardar version/JAR/APK/web build anterior si aplica.

### Frontend

- Ejecutar `npx.cmd tsc --noEmit`.
- Ejecutar ESLint acotado o general.
- Validar pantalla afectada en web.
- Validar mobile si la pantalla es operativa.
- Confirmar que los errores visibles son amigables.

### Backend

- Ejecutar `.\mvnw.cmd test`.
- Validar arranque si cambio backend.
- Revisar logs backend.
- Validar que no existan errores de Flyway.

### Permisos

- Usuario con permiso puede ver y ejecutar.
- Usuario sin permiso no ve o recibe acceso denegado amigable.
- Backend devuelve 401/403 de forma controlada.

### Smoke tests criticos

- Smoke tecnico.
- Smoke operacional.
- Smoke visual.
- Smoke seguridad.
- Login/logout.
- Dashboard.
- Clientes.
- Inventario.
- Lotes.
- Live/reservas.
- Venta puerta.
- Pagos.
- Paquetes/envios.
- Reportes principales.
- Evidencia registrada para flujos criticos.

## Release

- Registrar version o identificador de cambio.
- Registrar rama y commit.
- Publicar artefacto o desplegar con ventana controlada.
- Monitorear logs durante arranque.
- Validar health check: `/api/health`.

## Post-release

- Ejecutar smoke test minimo.
- Revisar logs frontend/backend.
- Validar usuario operativo.
- Validar usuario administrador.
- Documentar incidentes.
- Registrar ejecucion en `docs/ERP_QA_EXECUTION_LOG.md`.
- Actualizar bitacora ERP.

## Rollback

- Identificar commit/artefacto anterior.
- Revertir cambios de frontend si falla UX.
- Revertir backend/JAR si falla API.
- Revertir migracion solo si existe plan probado.
- Confirmar sistema operativo despues de rollback.

## Bloqueantes de release

- Pruebas minimas fallidas sin justificacion.
- Migracion no probada.
- Error tecnico visible al usuario en flujo critico.
- Archivos no rastreados que alteren build.
- Cambio de seguridad sin matriz de permisos.
- Cambio de pagos/caja sin regresion.
- Primera corrida QA sin evidencia o sin execution log.

