# ERP - Bitacora de cambios

## 2026-05-11 - Fase 0

Tipo: documentacion inicial ERP.

Cambios:

- Se genero inventario inicial de modulos, pantallas, endpoints, permisos, riesgos y roadmap.
- No se modifico codigo.
- No se modifico base de datos.
- No se generaron migraciones.

Hallazgos:

- Estado general MEDIO con flujos FRAGILES.
- Seguridad dispersa por servicios.
- UX y validaciones no homologadas.
- Proveedores/lotes/calidad existen, pero requieren consolidacion.
- Codificacion de textos con acentos rota en varios archivos.

Pendiente:

- Validar pruebas automatizadas reales.
- Validar cada endpoint contra permiso esperado.
- Validar cada pantalla en web y mobile.
- Confirmar control release sobre Git en cada fase.

## 2026-05-12 - Fase 1A

Tipo: estabilizacion UX minima y preparacion de regresion.

Objetivo:

- Corregir textos visibles con codificacion rota.
- Reducir exposicion de mensajes tecnicos al usuario.
- Documentar estandar minimo de UX para mensajes, validaciones y acceso denegado.
- Preparar base de QA para regresion.

Cambios realizados:

- Se creo `docs/ERP_FASE_1A_PLAN.md`.
- Se actualizaron reglas UX en `docs/ERP_GUIA_UI_UX.md`.
- Se actualizaron reglas de presentacion en `docs/ERP_MATRIZ_VALIDACIONES.md`.
- Se corrigieron mensajes visibles en `services/apiClient.ts`.
- Se verifico que no quedaran patrones de mojibake en `app`, `components`, `services`, backend Java y docs ERP.
- Se actualizo el resumen ejecutivo y riesgos operativos para reflejar que Git ya existe y que la rama de trabajo fue verificada.

Archivos modificados:

- `services/apiClient.ts`
- `docs/ERP_FASE_1A_PLAN.md`
- `docs/ERP_GUIA_UI_UX.md`
- `docs/ERP_MATRIZ_VALIDACIONES.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_DEFINICION_DE_HECHO.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Pruebas ejecutadas:

- OK: `npx.cmd tsc --noEmit`.
- OK: `npx.cmd eslint services/apiClient.ts components/ui/AppNoticeDropdown.tsx`.
- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.

Riesgos pendientes:

- `.tmp-pdf-images/` aparece como no rastreado en Git; no se toco.
- Aun existen muchas alertas nativas que deben homologarse en fases posteriores.
- Seguridad y permisos quedan fuera de alcance en Fase 1A.
- `.\mvnw.cmd test` emitio advertencias de Logback al rotar `C:/HPSQ-SOFT/control-ropa/logs/backend/control-ropa.log`; no bloqueo el build.
- `.\mvnw.cmd test` emitio advertencias por MySQL 5.7 fuera del soporte comunitario de Hibernate/Flyway y por Mockito dynamic agent; quedan para revision tecnica posterior.

Siguiente fase recomendada:

- Iniciar Fase 1B para checklist de regresion por flujo critico y limpieza de artefactos no rastreados.

## 2026-05-12 - Fase 1B

Tipo: gobernanza ERP, release control y criterios de terminado.

Objetivo:

- Formalizar Definition of Done por tamano de cambio.
- Formalizar checklist release ERP.
- Definir ownership por modulo.
- Definir arquitectura objetivo.
- Clasificar riesgos operativos con severidad, probabilidad, mitigacion y rollback.
- Mejorar roadmap con dependencias, criterios de salida, esfuerzo y riesgo.

Documentos creados:

- `docs/ERP_DEFINITION_OF_DONE.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_OWNERSHIP_MATRIX.md`
- `docs/ERP_TARGET_ARCHITECTURE.md`

Documentos actualizados:

- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_GUIA_UI_UX.md`
- `docs/ERP_MATRIZ_VALIDACIONES.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Riesgos detectados:

- `.tmp-pdf-images/` y `cambios_fase1a.diff` aparecen como no rastreados; no se tocaron.
- Persisten riesgos criticos en permisos, ventas/pagos, auditoria de negocio y ausencia de regresion automatizada amplia.
- La seguridad sigue fuera de alcance hasta Fase 4.
- Existia `ERP_DEFINICION_DE_HECHO.md`; se conserva como alias historico y el documento canonico queda como `ERP_DEFINITION_OF_DONE.md`.

Siguiente fase sugerida:

- Fase 1C: limpieza de artefactos Git, checklist de regresion manual inicial y matriz endpoint-permiso preliminar sin cambios de seguridad.

## 2026-05-12 - Fase 1C

Tipo: regresion operacional, smoke tests, release flow e incident response.

Objetivo:

- Formalizar regresion operacional ERP.
- Definir smoke tests minimos pre/post-release.
- Documentar flujo feature -> develop -> QA -> main.
- Definir ambientes DEV/QA/STAGING/PROD.
- Documentar respuesta a incidentes operativos.
- Preparar matriz endpoint-permiso preliminar sin modificar seguridad real.

Documentos creados:

- `docs/ERP_QA_REGRESION_OPERACIONAL.md`
- `docs/ERP_SMOKE_TESTS.md`
- `docs/ERP_RELEASE_FLOW.md`
- `docs/ERP_ENVIRONMENTS.md`
- `docs/ERP_INCIDENT_RESPONSE.md`

Documentos actualizados:

- `docs/ERP_MATRIZ_PERMISOS.md`
- `docs/ERP_MATRIZ_ENDPOINTS.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Riesgos detectados:

- `.tmp-pdf-images/`, `cambios_fase1a.diff` y `cambios_fase1b.diff` aparecen como no rastreados; no se tocaron.
- La matriz endpoint-permiso sigue siendo preliminar y debe validarse en Fase 4 contra codigo/servicios.
- Los flujos de pagos, ventas, live y lotes siguen siendo criticos y requieren regresion operacional antes de cualquier release.

Siguiente fase sugerida:

- Fase 1D: preparar datos QA y plantilla de evidencia de regresion por usuario/rol, sin tocar logica.

## 2026-05-12 - Fase 1D

Tipo: datos QA, usuarios por rol y evidencia de regresion.

Objetivo:

- Definir dataset QA repetible para smoke/regresion.
- Definir usuarios QA por perfil operativo.
- Crear plantilla de evidencia y bitacora de ejecucion.
- Crear scripts QA complementarios sin modificar migraciones Flyway ni comportamiento productivo.
- Referenciar dataset/evidencia en smoke, regresion y release checklist.

Documentos creados:

- `docs/ERP_QA_DATASET.md`
- `docs/ERP_QA_USERS_ROLES.md`
- `docs/ERP_QA_EVIDENCE_TEMPLATE.md`
- `docs/ERP_QA_EXECUTION_LOG.md`

Scripts QA creados:

- `docs/qa/03-datos-base-qa.sql`
- `docs/qa/04-usuarios-roles-qa.sql`

Documentos actualizados:

- `docs/ERP_SMOKE_TESTS.md`
- `docs/ERP_QA_REGRESION_OPERACIONAL.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Riesgos detectados:

- `.tmp-pdf-images/`, `cambios_fase1a.diff`, `cambios_fase1b.diff` y `cambios_fase1c.diff` aparecen como no rastreados; no se tocaron.
- `docs/qa/01-preparacion-datos-qa.sql` ya contiene datos QA amplios, pero debe validarse contra el esquema actual antes de usarlo como prerequisito formal.
- Los scripts Fase 1D dependen de que existan sucursales/usuarios base creados por `01-preparacion-datos-qa.sql`.
- Los usuarios QA con `{noop}Qa12345!` deben validarse contra la configuracion real de autenticacion del ambiente.

Pruebas ejecutadas:

- Revision documental y de esquema mediante lectura de migraciones Flyway y scripts QA existentes.
- No se ejecutaron pruebas de frontend/backend porque esta fase no modifica codigo funcional.

Siguiente fase sugerida:

- Fase 1E: ejecutar dataset QA en ambiente controlado, capturar primera evidencia real y limpiar/decidir artefactos Git no rastreados antes de release candidato.

## 2026-05-12 - Fase 1E

Tipo: preparacion de ejecucion QA controlada.

Objetivo:

- Preparar la primera ejecucion QA real sin tocar comportamiento productivo.
- Crear plan de fase y runbook operativo.
- Documentar riesgos de scripts QA existentes.
- Actualizar checklist release, execution log y roadmap.

Documentos creados:

- `docs/ERP_FASE_1E_PLAN.md`
- `docs/ERP_QA_RUNBOOK_1E.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_ROADMAP_FASES.md`

Riesgos detectados:

- `.tmp-pdf-images/`, `cambios_fase1a.diff`, `cambios_fase1b.diff`, `cambios_fase1c.diff` y `cambios_fase1d.diff` aparecen como no rastreados; no se tocaron.
- `docs/qa/03-datos-base-qa.sql` depende de `QA_CTR`, `qa.admin@local.test` y migracion `V37__suppliers_and_batch_quality.sql`.
- `docs/qa/04-usuarios-roles-qa.sql` reasigna roles/permisos solo de usuarios QA especificos; debe ejecutarse exclusivamente en ambiente QA.
- La ejecucion real queda pendiente; esta fase solo prepara el control.

Pruebas ejecutadas:

- Revision documental de dataset, usuarios, evidencia, smoke, checklist y scripts QA.
- No se ejecutaron SQL ni pruebas funcionales.
- No se modifico codigo productivo.

Siguiente fase sugerida:

- Fase 1F: ejecutar el runbook en ambiente QA, capturar evidencias y decidir si el release candidato queda aprobado, rechazado o bloqueado.

## 2026-05-12 - Fase 1F

Tipo: hardening de gobernanza QA y release candidate.

Objetivo:

- Fortalecer gobernanza QA antes de ejecutar la primera corrida real.
- Definir severidades de defectos y su relacion con bloqueo/rollback.
- Definir flujos criticos ERP y su obligatoriedad QA.
- Definir estandar de evidencias.
- Definir politica de release candidate.
- Crear registro de known issues.
- Mejorar smoke tests y release checklist con control RC.

Documentos creados:

- `docs/ERP_DEFECT_SEVERITY.md`
- `docs/ERP_CRITICAL_FLOWS.md`
- `docs/ERP_EVIDENCE_STANDARD.md`
- `docs/ERP_RELEASE_CANDIDATE_POLICY.md`
- `docs/ERP_KNOWN_ISSUES.md`

Documentos actualizados:

- `docs/ERP_SMOKE_TESTS.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_QA_REGRESION_OPERACIONAL.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Riesgos detectados:

- `.tmp-pdf-images/`, `cambios_fase1a.diff`, `cambios_fase1b.diff`, `cambios_fase1c.diff`, `cambios_fase1d.diff` y `cambios_fase1e.diff` aparecen como no rastreados; no se tocaron.
- La primera ejecucion QA real sigue pendiente por instruccion de fase.
- Las severidades y tiempos SLA deben calibrarse con responsables reales.
- Known issues queda inicializado y debe alimentarse durante la corrida real.

Pruebas ejecutadas:

- Revision documental de runbook, checklist, smoke, regresion, roadmap y bitacora.
- No se ejecutaron pruebas reales, SQL ni comandos de build.
- No se modifico codigo productivo.

Siguiente fase sugerida:

- Fase 1G: ejecutar la primera corrida QA real controlada, registrar evidencias bajo el estandar definido y decidir si existe release candidate.

## 2026-05-12 - Fase 1G

Tipo: primera corrida QA real controlada.

Objetivo:

- Ejecutar validacion operacional real usando proceso QA definido.
- Registrar resultados por flujo, severidad, impacto y bloqueo RC.
- Alimentar known issues con defectos reales.
- Decidir estado de release candidate.

Documento creado:

- `docs/ERP_QA_EXECUTION_1G.md`

Documentos actualizados:

- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Resultados principales:

- OK: login/logout operativo, dashboard API, clientes API, inventario API, lotes API, live lectura API, venta QA controlada, pago QA controlado, reporte diario tienda API, usuarios/roles admin API.
- BLOCKED: frontend web local, health check publico, usuario sin permisos, usuarios reportes/soporte.
- Venta QA creada: `saleId=1`, item `QA-CTR-001`, total `125.00`.
- Pago QA creado: `paymentId=1`, `saleId=1`, total `125.00`.

Known issues agregados:

- `KI-002`: `/api/health` responde 401.
- `KI-003`: frontend web `localhost:8081` no disponible.
- `KI-004`: `qa.sinpermisos@local.test` no valida login.
- `KI-005`: `qa.reportes@local.test` y `qa.soporte@local.test` no validan login.

Decision:

- `RC RECHAZADO`.

Pruebas ejecutadas:

- Pruebas reales API contra `http://localhost:8090`.
- No se ejecuto SQL.
- No se corrigieron bugs.
- No se modifico codigo productivo.

Siguiente fase sugerida:

- Fase 1H: preparar correcciones acotadas o preparacion de ambiente/dataset para desbloquear RC, sin mezclar refactors.

## 2026-05-12 - Fase 1H / KI-002

Tipo: correccion acotada de healthcheck backend.

Objetivo:

- Desbloquear el smoke tecnico de release para `/api/health`.
- Mantener el cambio limitado al filtro de token sin alterar seguridad general ni flujos operativos.

Causa encontrada:

- `SecurityConfig` permitia las rutas, pero `ApiTokenFilter` validaba todo `/api/*` antes del controlador.
- `/api/health` no estaba dentro de las excepciones publicas del filtro y por eso respondia `401`.

Cambios realizados:

- Se excluyo unicamente `/api/health` de la validacion de token en `ApiTokenFilter`.
- Se agrego prueba automatizada para confirmar que `GET /api/health` no requiere token y responde `status=OK`.
- Se actualizo known issue y checklist de release para exigir validacion de healthcheck sin token.

Archivos modificados:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/config/ApiTokenFilter.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/health/HealthControllerSecurityTests.java`
- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Pruebas ejecutadas:

- `.\mvnw.cmd test` en `backend/control-ropa`: exitoso.
- Prueba agregada: `HealthControllerSecurityTests.healthEndpointDoesNotRequireSessionToken`.

Riesgos pendientes:

- El backend QA en ejecucion debe reiniciarse/desplegarse con esta rama y repetirse el smoke tecnico runtime.
- `KI-002` queda en validacion hasta confirmar `/api/health` en el ambiente QA real.

Rollback:

- Revertir la excepcion de `/api/health` en `ApiTokenFilter`.
- Remover la prueba automatizada asociada si se decide que el healthcheck debe volver a requerir token.

Siguiente bloqueo recomendado:

- `KI-003`: frontend web `localhost:8081` no disponible durante la corrida QA.

## 2026-05-12 - Fase 1H / KI-004 y KI-005

Tipo: correccion acotada de dataset QA para usuarios de regresion.

Objetivo:

- Desbloquear smoke de permisos negativos, reportes y soporte tecnico.
- Corregir solo usuarios QA sin tocar seguridad global, frontend, backend productivo, ventas, pagos, live, lotes ni migraciones Flyway.

Causa probable:

- Los usuarios `qa.sinpermisos@local.test`, `qa.reportes@local.test` y `qa.soporte@local.test` dependian de `docs/qa/04-usuarios-roles-qa.sql`.
- Ese script activaba usuarios existentes, pero no actualizaba `password_hash` cuando ya existian.
- Tambien era posible que quedaran bloqueados en `user_login_security` por intentos fallidos previos.

Cambios realizados:

- Se creo `docs/qa/05-fix-usuarios-qa-login.sql` como script SOLO QA.
- El script resetea password `{noop}Qa12345!`, estado `ACTIVE`, sucursal `QA_CTR`, roles, permisos esperados y bloqueo temporal de login para los tres usuarios QA.
- `NO_ACCESS` queda sin permisos efectivos para validar acceso denegado.
- `REPORTS` queda con permisos de consulta.
- `SUPPORT_TECH` queda con permisos minimos de soporte existentes.

Documentos actualizados:

- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_QA_DATASET.md`
- `docs/ERP_QA_USERS_ROLES.md`
- `docs/ERP_QA_RUNBOOK_1E.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Pruebas ejecutadas:

- No se ejecuto SQL.
- No aplica `.\mvnw.cmd test` porque no se modifico codigo Java productivo ni tests.
- Validacion pendiente: ejecutar `docs/qa/05-fix-usuarios-qa-login.sql` en QA y repetir login real.

Riesgos pendientes:

- Si `QA_CTR` no existe, el script no podra crear/actualizar usuarios; debe ejecutarse primero `docs/qa/01-preparacion-datos-qa.sql`.
- `KI-004` y `KI-005` quedan en validacion hasta probar login real con `Qa12345!`.

Rollback:

- No ejecutar el script si no se requiere.
- Si ya se ejecuto, revertir restaurando backup QA previo o desactivando los tres usuarios QA especificos.

Siguiente validacion recomendada:

- Ejecutar en QA: `01-preparacion-datos-qa.sql` si falta base, luego `04-usuarios-roles-qa.sql`, luego `05-fix-usuarios-qa-login.sql`.
- Repetir login de `qa.sinpermisos@local.test`, `qa.reportes@local.test` y `qa.soporte@local.test`.
- Repetir `SMK-SEC-01`, `SMK-SEC-02` y reportes con perfil `qa.reportes@local.test`.

## 2026-05-12 - Validacion runtime KI-004/KI-005 y separacion KI-006

Tipo: documentacion de evidencia QA runtime.

Validacion reportada:

- `qa.sinpermisos@local.test` inicia sesion y queda sin accesos operativos.
- `qa.reportes@local.test` inicia sesion con accesos esperados a reportes.
- `qa.soporte@local.test` inicia sesion con accesos tecnicos/admin esperados.
- `/api/health` ya no responde `401`, pero responde `404`.

Cambios documentales:

- `KI-004` marcado como `Resuelto validado`.
- `KI-005` marcado como `Resuelto validado`.
- `KI-002` actualizado como bloqueo original de token avanzado/cerrado parcialmente.
- Se crea `KI-006` para separar el nuevo problema runtime: `/api/health` devuelve `404` por posible mapping, context-path o artefacto en ejecucion.

Decision release:

- RC sigue no aprobado.
- Bloqueos vigentes: `KI-003` frontend web sin evidencia y `KI-006` healthcheck 404.

Siguiente fase recomendada:

- Corregir `KI-006` de forma acotada revisando mapping/runtime de healthcheck.
- Despues repetir smoke tecnico `GET /api/health`.


## 2026-05-12 - Fase 1H / KI-006

Tipo: correccion acotada de mapping healthcheck backend.

Objetivo:

- Hacer accesible el healthcheck para smoke tecnico pre/post-release.
- Mantener el cambio limitado a healthcheck, sin tocar modulos operativos, datos, frontend, ventas, pagos, live, lotes ni migraciones.

Causa encontrada:

- En codigo, `HealthController` existe bajo paquete escaneado y no hay `server.servlet.context-path` configurado; la ruta esperada es `GET /api/health`.
- La prueba automatizada registra correctamente el mapping.
- El 404 reportado en runtime indica probable artefacto/proceso QA desactualizado, ruta con slash/contexto distinto o despliegue que no contiene el controlador actualizado.

Cambios realizados:

- `HealthController` registra explicitamente `GET /api/health` y `GET /api/health/`.
- `ApiTokenFilter` permite ambas variantes sin token.
- Se amplio la prueba automatizada para validar ambas rutas.
- Se actualizo known issue, release checklist y execution log.

Archivos modificados:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/health/HealthController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/config/ApiTokenFilter.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/health/HealthControllerSecurityTests.java`
- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Pruebas ejecutadas:

- `.\mvnw.cmd test` en `backend/control-ropa`: exitoso.
- `HealthControllerSecurityTests`: `GET /api/health` y `GET /api/health/` responden `200 OK` con `status=OK`.

Riesgos pendientes:

- `KI-006` queda en validacion hasta reiniciar/desplegar backend QA y confirmar por curl contra runtime real.
- Si runtime sigue respondiendo `404`, revisar contexto de despliegue, puerto usado y artefacto/JAR activo.

Rollback:

- Revertir el mapping explicito en `HealthController`.
- Revertir la excepcion de `/api/health/` en `ApiTokenFilter`.
- Revertir la prueba adicional si se decide no soportar trailing slash.

Comando recomendado para validar runtime:

- `curl -i http://localhost:8090/api/health`
- `curl -i http://localhost:8090/api/health/`
=======
## 2026-05-12 - Fase 1I / cierre runtime KI-006

Tipo: cierre documental con evidencia runtime real.

Validacion reportada:

- Comando ejecutado: `curl -i http://localhost:8090/api/health`.
- Resultado: `HTTP/1.1 200 OK`.
- Respuesta JSON: `status=OK` y `timestamp`.

Causa raiz real:

- El `404` anterior fue provocado por validacion contra puerto incorrecto `8080`.
- El backend QA correcto corre en `8090`.

Cambios documentales:

- `KI-002` queda como `Resuelto validado`.
- `KI-006` queda como `Resuelto validado`.
- Se actualiza execution log con smoke tecnico exitoso.
- Se actualiza resumen ejecutivo para reflejar backend/API tecnicamente validado.

Decision release:

- Backend/API queda desbloqueado tecnicamente para RC.
- RC completo no queda aprobado todavia porque `KI-003` frontend web/visual sigue abierto.

Siguiente fase recomendada:

- Resolver `KI-003`: levantar frontend QA, capturar evidencia visual y repetir smoke visual/navegacion principal.

## 2026-05-12 - Fase 1J / frontend visual QA

Tipo: validacion frontend runtime y decision RC visual.

Validaciones ejecutadas:

- Rama: `feature/fase1j-frontend-visual-qa`.
- `npm run web` falla antes de levantar Expo por `Acceso denegado` al escribir `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`.
- Workaround de QA: `npx.cmd expo start --web --port 8081`.
- `http://localhost:8081` responde `200`.
- Rutas verificadas por HTTP runtime: `/login`, `/dashboard`, `/customers`, `/items`, `/batches`, `/reports`, `/users`, `/system-roles`.

Resultado visual/UX:

- Frontend web ya esta disponible en `localhost:8081`, por lo que `KI-003` avanza a `En validacion`.
- Se detecto texto visible con codificacion rota en `/login`: `Iniciar sesiÃ³n`, `ContraseÃ±a`.
- Se detecto mojibake tambien en `/reports`.
- No se pudo aprobar RC visual por calidad de texto visible y arranque QA no repetible con el script oficial.

Issues nuevos:

- `KI-007`: textos visibles con codificacion rota en frontend web.
- `KI-008`: `npm run web` falla por permisos/ruta de log frontend.

Decision:

- `NO-GO` para RC visual.
- Backend/API sigue desbloqueado.
- RC completo sigue rechazado hasta resolver `KI-007` y `KI-008`, y completar evidencia visual interactiva.

Siguiente fase recomendada:

- Fase 1K: correccion acotada de codificacion visible y arranque frontend QA, sin tocar logica de negocio.

