# ERP - Runbook QA 1E

Fecha: 2026-05-12  
Objetivo: ejecutar la primera prueba QA controlada de forma repetible.

## 1. Preparar ambiente

1. Confirmar que se esta trabajando en ambiente DEV/QA, nunca PROD.
2. Confirmar rama: `git branch --show-current`.
3. Confirmar estado Git: `git status --short`.
4. Confirmar backend apuntando a base QA.
5. Confirmar frontend apuntando a backend QA.
6. Crear respaldo de base QA.
7. Definir carpeta o ubicacion para capturas/evidencias.

Resultado esperado:

- Ambiente identificado.
- Backup disponible.
- No hay duda sobre base/API usada.

## 2. Validar base

1. Confirmar que Flyway arranca sin errores.
2. Confirmar que existe tabla `suppliers`.
3. Confirmar que `batches` tiene columnas `supplier_id`, `received_at`, `quality_score`, `quality_notes`.
4. Confirmar que existen tablas `user_branches`, `users`, `roles`, `permissions`, `user_permissions`.
5. Confirmar que no se usaran datos reales.

Resultado esperado:

- La base soporta scripts QA Fase 1D.
- Si falta una tabla/columna, detener y registrar `BLOQUEADO POR ESQUEMA`.

## 3. Ejecutar scripts QA si aplica

Orden sugerido en ambiente QA:

1. Ejecutar `docs/qa/01-preparacion-datos-qa.sql` si el dataset base no existe.
2. Ejecutar `docs/qa/03-datos-base-qa.sql` para proveedores/calidad.
3. Ejecutar `docs/qa/04-usuarios-roles-qa.sql` para perfiles adicionales.

Reglas:

- No ejecutar `docs/qa/02-limpieza-datos-qa.sql` durante la preparacion, salvo que QA apruebe limpieza y exista backup.
- No ejecutar ningun SQL en PROD.
- Si un script falla, detener la corrida y guardar mensaje de error.

Validaciones posteriores:

- Existe `QA_CTR`.
- Existe `qa.admin@local.test`.
- Existen `qa.reportes@local.test`, `qa.sinpermisos@local.test`, `qa.soporte@local.test`.
- Existen proveedores `QA_SUP_FAST` y `QA_SUP_REVIEW`.
- Existe lote `QA-LOTE-PENDIENTE-001`.

## 4. Validar usuarios

1. Login con `qa.admin@local.test`.
2. Login con `qa.vendedor.centro@local.test`.
3. Login con `qa.caja.centro@local.test`.
4. Login con `qa.inventario.centro@local.test`.
5. Login con `qa.logistica.centro@local.test`.
6. Login con `qa.reportes@local.test`.
7. Login con `qa.sinpermisos@local.test`.
8. Login con `qa.soporte@local.test`.

Resultado esperado:

- Usuarios permitidos entran.
- Usuario sin permisos no ejecuta acciones criticas.
- Errores 401/403 se muestran de forma amigable.

## 5. Correr smoke tests

Ejecutar en el orden de `docs/ERP_SMOKE_TESTS.md`:

1. `SMK-LOGIN-01`
2. `SMK-DASH-01`
3. `SMK-CUS-01`
4. `SMK-INV-01`
5. `SMK-BAT-01`
6. `SMK-LIVE-01`
7. `SMK-SALE-01`
8. `SMK-PAY-01`
9. `SMK-PKG-01`
10. `SMK-SHP-01`
11. `SMK-REP-01`
12. `SMK-SEC-01`

Regla de bloqueo:

- Si falla login, ventas, pagos, permisos o backend, detener y marcar release como `BLOQUEADO`.
- Si falla reporte no critico sin error 500, registrar defecto y continuar si QA lo autoriza.

## 6. Registrar evidencia

Por cada flujo critico:

1. Copiar `docs/ERP_QA_EVIDENCE_TEMPLATE.md` o llenar una evidencia equivalente.
2. Registrar ambiente, rama, commit, usuario, flujo y resultado.
3. Adjuntar captura o ruta de evidencia.
4. Registrar errores con severidad.
5. Actualizar `docs/ERP_QA_EXECUTION_LOG.md`.

## 7. Decidir aprobado/rechazado

| Condicion | Decision |
|---|---|
| Todos los smoke criticos pasan | APROBADO PARA SIGUIENTE VALIDACION |
| Falla login/backend/permisos criticos | BLOQUEADO |
| Falla venta/pago/caja | BLOQUEADO |
| Falla reporte no critico sin impacto operativo | APROBADO CON RIESGO o RECHAZADO segun QA |
| Faltan datos QA para flujo critico | BLOQUEADO POR DATASET |

## 8. Cierre

1. Guardar evidencias.
2. Guardar logs relevantes.
3. Actualizar `docs/ERP_QA_EXECUTION_LOG.md`.
4. Actualizar `docs/ERP_BITACORA_CAMBIOS.md` si hubo hallazgos.
5. No limpiar datos QA hasta que QA/Release Manager confirme que ya no se requiere auditoria.

## Riesgos documentados de scripts QA

- `docs/qa/03-datos-base-qa.sql` actualiza lotes QA existentes y crea un lote pendiente; depende de `qa.admin@local.test` y `QA_CTR`.
- `docs/qa/04-usuarios-roles-qa.sql` elimina y reasigna roles/permisos solo para `qa.reportes@local.test`, `qa.sinpermisos@local.test` y `qa.soporte@local.test`.
- Ambos scripts requieren que `01-preparacion-datos-qa.sql` haya creado sucursales y usuario admin.
- Ambos scripts deben ejecutarse solo despues de backup QA.
