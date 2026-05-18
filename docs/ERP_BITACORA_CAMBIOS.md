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

## 2026-05-12 - Fase 1K / frontend encoding y logs

Tipo: correccion acotada frontend QA.

Objetivo:

- Resolver `KI-007` mojibake/codificacion visible.
- Resolver `KI-008` arranque web bloqueado por permisos de logs/cache.
- Mantener el cambio limitado a frontend runtime y documentacion, sin tocar backend, APIs, seguridad ni logica ERP.

Causa encontrada:

- Los fuentes visibles revisados (`app/login.tsx`, `app/reports.tsx`) ya estan guardados en UTF-8 correcto; el mojibake reportado venia de evidencia runtime/lectura sin decodificacion UTF-8 y cache/arranque web inestable.
- `npm run web` fallaba porque `scripts/start-web-logs.ps1` detenia el proceso al no poder escribir `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`.
- Expo tambien intentaba escribir cache bajo el perfil de Windows y podia fallar con `EPERM`; se aislo el home de Expo a `%TEMP%\control-ropa-expo-home` durante el arranque web.

Cambios realizados:

- `scripts/start-web-logs.ps1` ahora usa un home temporal escribible para Expo.
- El log frontend rota/escribe en C: cuando tiene permiso, pero si Windows lo bloquea muestra advertencia y continua en consola.
- No se modificaron pantallas, backend, endpoints, base de datos ni seguridad.

Archivos modificados:

- `scripts/start-web-logs.ps1`
- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Pruebas ejecutadas:

- `npm.cmd run web`: levanta Metro hasta `Waiting on http://localhost:8081`; el intento queda vivo y la herramienta lo corta por timeout, sin error fatal por logs/cache.
- Runtime HTTP con servidor Expo: `/login`, `/`, `/reports`, `/branches`, `/system-roles` responden `200` y decodifican UTF-8 sin patrones `Ã`, `Â`, `â€` ni `�`.
- OK: `npx.cmd tsc --noEmit`.
- `npx.cmd eslint scripts/start-web-logs.ps1`: no aplica porque ESLint ignora `.ps1`; resultado sin errores de codigo frontend.

Riesgos pendientes:

- El archivo `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log` sigue requiriendo correccion de permisos Windows si se desea persistencia en esa ruta exacta.
- RC completo no queda aprobado automaticamente; requiere checklist RC y evidencia visual formal.

Decision:

- `KI-007` queda `Resuelto validado`.
- `KI-008` queda `Resuelto validado`.
- `KI-003` queda tecnicamente desbloqueado para RC candidato completo, pendiente aprobacion formal de release.

## 2026-05-12 - Fase 1L / revision final RC

Tipo: revision documental final de Release Candidate.

Objetivo:

- Revisar evidencia disponible antes de recomendar GO/NO-GO.
- Confirmar estado de backend, frontend, usuarios QA, healthcheck y known issues.
- Decidir si el sistema puede considerarse RC candidato aprobable sin aprobar release final automaticamente.

Documento creado:

- `docs/ERP_RC_FINAL_REVIEW.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Resultado:

- No hay `SEV-1` ni `SEV-2` abiertos.
- `KI-001` queda abierto como `SEV-3` no bloqueante para RC candidato.
- Backend/API, healthcheck, usuarios QA y frontend web quedan documentados como validados para RC.

Decision:

- `GO PARA RC CANDIDATO APROBABLE`.
- No se aprueba release final automatico.

Riesgos pendientes:

- Adjuntar evidencia visual formal completa antes de release final.
- Revisar artefactos Git/`KI-001` antes de merge/tag.
- Repetir smoke tecnico y visual en ventana final de release.

## 2026-05-12 - Fase 2A / diseno multi-compania

Tipo: arquitectura SaaS y seguridad multi-tenant.

Objetivo:

- Disenar multi-compania antes de implementar.
- Evitar fuga de datos entre clientes/empresas.
- Mantener una sola aplicacion y una sola base en un solo servidor.
- No modificar codigo, base de datos, migraciones, frontend, backend ni SQL.

Analisis realizado:

- Backend actual modular en `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa`.
- Esquema actual basado en `branches`, `users.branch_id` y `user_branches`.
- Seguridad actual con `ApiTokenFilter`, `CurrentUser` y `AccessService`.
- Frontend actual basado en `session.branchId` y servicios por `/branch/{branchId}`.
- Reportes actuales reciben `branchId` y requieren tenant scope futuro.

Documentos creados:

- `docs/ERP_MULTICOMPANY_ARCHITECTURE.md`
- `docs/ERP_MULTICOMPANY_DATA_MODEL.md`
- `docs/ERP_MULTICOMPANY_SECURITY.md`
- `docs/ERP_MULTICOMPANY_MIGRATION_PLAN.md`
- `docs/ERP_MULTICOMPANY_QA_PLAN.md`

Documentos actualizados:

- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Decision arquitectonica sugerida:

- Usar una sola base de datos y una sola aplicacion.
- Agregar `company_id` obligatorio en tablas tenant-scoped.
- Mantener `branch_id` como scope operativo subordinado a `company_id`.
- Resolver tenant en backend desde token/sesion; no confiar en frontend.

Riesgos criticos:

- Fuga de datos entre companias si se usa solo `branch_id`.
- Permisos globales aplicados indebidamente a varias empresas.
- Reportes financieros sin filtro `company_id`.
- Soporte tecnico HPSQ-SOFT sin auditoria por compania.

Siguiente fase recomendada:

- Fase 2B: crear matriz endpoint-tabla-tenant y matriz de migracion por tabla antes de escribir codigo o SQL.

## 2026-05-12 - Fase 2A / ampliacion consola SaaS HPSQ-SOFT

Tipo: arquitectura SaaS, product ownership y seguridad de plataforma.

Objetivo:

- Ampliar el diseno multi-compania para incluir consola privada HPSQ-SOFT.
- Separar administracion SaaS de operacion ERP cliente.
- Definir roles HPSQ-SOFT, roles cliente, planes, limites, suspension, soporte y auditoria.
- Mantener la regla de no implementar codigo, migraciones ni cambios funcionales.

Documentos creados:

- `docs/ERP_SAAS_ADMIN_CONSOLE.md`
- `docs/ERP_SAAS_ROLES_PERMISSIONS.md`
- `docs/ERP_SAAS_BILLING_AND_PLANS.md`

Documentos actualizados:

- `docs/ERP_MULTICOMPANY_ARCHITECTURE.md`
- `docs/ERP_MULTICOMPANY_DATA_MODEL.md`
- `docs/ERP_MULTICOMPANY_SECURITY.md`
- `docs/ERP_MULTICOMPANY_MIGRATION_PLAN.md`
- `docs/ERP_MULTICOMPANY_QA_PLAN.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_TARGET_ARCHITECTURE.md`
- `docs/ERP_OWNERSHIP_MATRIX.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Decision:

- Mantener una sola aplicacion y una sola base con `company_id`.
- Crear consola SaaS privada HPSQ-SOFT en fases futuras, no visible para clientes.
- Separar roles `SAAS_*` y roles HPSQ-SOFT de roles ERP cliente.
- No implementar billing automatico todavia; primero controles administrativos, limites, suspension/reactivacion y auditoria.

Riesgos agregados:

- Consola SaaS visible a clientes.
- Soporte HPSQ-SOFT con acceso excesivo.
- Suspension comercial mal aplicada.
- Limites de plan validados solo en frontend.
- Modificacion de ventas/pagos desde soporte sin proceso formal.

Siguiente fase recomendada:

- Fase 2B: matriz endpoint-tabla-tenant, matriz roles SaaS/ERP y matriz de acciones auditables HPSQ-SOFT antes de implementar.

## 2026-05-13 - Fase 2B / matrices tenant y backlog tecnico

Tipo: analisis tecnico documental, sin codigo ni migraciones.

Objetivo:

- Preparar implementacion multi-compania segura.
- Identificar endpoints P0 que requieren validacion `company_id`.
- Identificar tablas P0 que requieren `company_id`, indices y unicidad por compania.
- Clasificar acciones HPSQ-SOFT que deben auditarse.
- Convertir hallazgos en backlog tecnico ordenado.

Documentos creados:

- `docs/ERP_TENANT_ENDPOINT_MATRIX.md`
- `docs/ERP_TENANT_TABLE_MATRIX.md`
- `docs/ERP_SAAS_AUDIT_ACTIONS_MATRIX.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`

Documentos actualizados:

- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Analisis realizado:

- Revision de controladores backend con rutas `/api/*`.
- Revision de servicios frontend en `services/` y uso de `session.branchId`.
- Revision de migraciones Flyway actuales para tablas, FKs, unicidades e indices.
- Revision de documentos Fase 2A multi-compania y SaaS HPSQ-SOFT.

Hallazgos principales:

- Muchos endpoints P0 reciben `branchId`, ids directos, folios, codigos o QR sin un `company_id` explicito en el modelo actual.
- Las tablas raiz mas criticas son `branches`, `users`, `customers`, `items`, `batches`, `sales`, `payments`, `reservations`, `lives`, `customer_orders`, `customer_packages`, `shipments`, `cash_closures` y `system_movement_audit_log`.
- Reportes y dashboard son criticos porque agregan multiples fuentes y podrian mezclar datos silenciosamente.
- Acciones HPSQ-SOFT como suspender empresa, cambiar plan, soporte delegado, consultar/exportar logs y reset de usuarios requieren auditoria estricta.

Siguiente fase recomendada:

- Fase 2C: preparar modelo base `companies`, compania default, diseno tecnico de `CurrentTenantContext` y plan de migracion por tabla antes de tocar flujos operativos.

## 2026-05-13 - Fase 2C / tenant core foundation

Tipo: diseno tecnico avanzado, sin codigo ni migraciones.

Objetivo:

- Definir el nucleo tenant-aware antes de implementar.
- Documentar `CurrentTenantContext`.
- Documentar auth/security tenant-aware.
- Documentar estrategia de migracion incremental.
- Definir reglas obligatorias de enforcement.
- Documentar escenarios de riesgo SaaS.

Documentos creados:

- `docs/ERP_TENANT_CORE_FOUNDATION.md`
- `docs/ERP_CURRENT_TENANT_CONTEXT_DESIGN.md`
- `docs/ERP_TENANT_AUTH_SECURITY.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_TENANT_ENFORCEMENT_RULES.md`
- `docs/ERP_TENANT_RISK_SCENARIOS.md`

Documentos actualizados:

- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Decisiones documentadas:

- El backend sera la unica autoridad tenant.
- `CurrentTenantContext` debe propagarse controller -> service -> query -> auditoria/logs.
- Company y branch se validan en cada request P0.
- Auth debe preferir resolver permisos server-side para evitar tokens stale.
- No iniciar implementacion por ventas/pagos/reportes; primero foundation tenant.

Riesgos destacados:

- Query sin `company_id`.
- Lookup global por QR/codigo.
- Reporte sin filtro tenant.
- Cache contaminado.
- Company suspendida operando con token previo.
- Soporte HPSQ-SOFT sin auditoria o sin expiracion.

Siguiente fase recomendada:

- Fase 2D: disenar/implementar en rama separada el modelo minimo `companies`, company default y validacion branch-company, con migraciones controladas y QA de login/dashboard antes de tocar flujos financieros.

## 2026-05-13 - Fase 2D / tenant bootstrap minimo

Tipo: implementacion backend y migracion minima, sin tocar ventas, pagos, live ni reportes.

Objetivo:

- Crear base minima multi-compania compatible con el sistema actual.
- Agregar company default para datos existentes.
- Vincular sucursales existentes con company default.
- Introducir contexto tenant backend sin activar multi-compania funcional completa.

Cambios realizados:

- Migracion `V38__tenant_bootstrap_companies.sql`.
- Tabla `companies`.
- Company default `DEFAULT / HPSQ-SOFT Default Company`.
- Columna `branches.company_id` con backfill.
- FK `branches.company_id -> companies.id`.
- Indice `idx_branches_company_status`.
- Unicidad `uq_branches_company_code`.
- Entidad `Company`.
- `CompanyRepository` y `CompanyService`.
- `CurrentTenantContext`.
- `TenantContextHolder`.
- `TenantResolver`.
- Endpoint autenticado `GET /api/tenant/current`.
- Validacion minima `assertBranchBelongsToCompany`.
- `BranchService` asigna company default si el alta actual no envia company.

Fuera de alcance respetado:

- No se migraron ventas.
- No se migraron pagos.
- No se migro live.
- No se migraron reportes.
- No se implemento consola SaaS HPSQ-SOFT.
- No se cambio frontend operativo.

Riesgos pendientes:

- `user_api_sessions` aun no guarda company/branch activa.
- Roles y permisos siguen globales.
- Tablas P0 operativas aun no tienen `company_id`.
- Reportes y dashboard siguen mono-compania por `branch_id`.
- Se requiere validacion runtime QA de Flyway sobre base real.

Siguiente fase recomendada:

- Fase 2E: validar runtime del bootstrap tenant, smoke login/sucursales/dashboard y preparar diseno/implementacion de `user_companies` y sesiones tenant-aware antes de migrar tablas P0.

## 2026-05-13 - Fase 2E / validacion runtime tenant

Tipo: validacion y documentacion, sin cambios funcionales.

Objetivo:

- Confirmar bootstrap tenant antes de migrar tablas P0.
- Documentar evidencia manual y tecnica.
- Identificar riesgos runtime.

Documento creado:

- `docs/ERP_TENANT_RUNTIME_VALIDATION.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Validacion manual reportada:

- Flyway `V38`.
- Company default `DEFAULT / HPSQ-SOFT Default Company`.
- Sucursales actuales con `company_id = 1`.
- Backend, dashboard, navegacion frontend y sucursales operativas.
- RC previo sin ruptura visible.

Validacion tecnica Codex:

- Revision de `TenantResolver`, `CurrentTenantContext`, `TenantController` y `BranchService`.
- `.\mvnw.cmd test` exitoso: `8 tests`, `0 failures`, `0 errors`.
- Intento HTTP contra `localhost:8090` detecto runtime no sincronizado con rama actual: `/api/tenant/current` no registrado y login QA devolvio `500`.

Decision:

- Bootstrap tenant queda `GO condicionado`.
- Migracion de tablas P0 queda `NO-GO` hasta reiniciar/desplegar backend y capturar evidencia JSON de `/api/tenant/current`.

Siguiente fase recomendada:

- Fase 2F: redeploy/reinicio controlado, smoke tenant runtime autenticado y preparacion de `user_companies`/sesiones tenant-aware.

## 2026-05-13 - Fase 2F / tenant runtime hardening

Tipo: implementacion minima backend/base de datos.

Objetivo:

- Preparar sesiones tenant-aware sin migrar ventas, pagos, live, reportes ni tablas P0.
- Crear relacion usuario-company.
- Guardar company/branch activa en sesiones nuevas.
- Mantener fallback compatible con el RC actual.

Cambios realizados:

- Creada migracion `V39__tenant_user_company_sessions.sql`.
- Creada tabla `user_companies`.
- Agregadas columnas `user_api_sessions.active_company_id` y `active_branch_id`.
- Agregado backfill de usuarios actuales hacia company default.
- Agregado backfill de sesiones actuales cuando aplica.
- Agregado `UserCompany`, `UserCompanyId`, `UserCompanyRepository` y `UserCompanyService`.
- `AuthService` crea sesiones nuevas con tenant activo.
- `ApiTokenFilter` valida company/branch activa cuando la sesion las trae.
- `TenantResolver` resuelve tenant desde sesion activa y conserva fallback temporal.
- Agregadas pruebas unitarias de user-company/branch y tenant current protegido.

Documentos creados:

- `docs/ERP_TENANT_RUNTIME_HARDENING.md`

Documentos actualizados:

- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Pruebas ejecutadas:

- `.\mvnw.cmd test`
- Resultado: `BUILD SUCCESS`, `14 tests`, `0 failures`, `0 errors`.
- Flyway valido `39 migrations`.

Fuera de alcance respetado:

- No se tocaron ventas.
- No se tocaron pagos.
- No se tocaron reportes.
- No se toco live.
- No se modifico frontend.
- No se implemento consola SaaS.
- No se implemento selector de tenant.

Riesgos pendientes:

- Roles y permisos siguen globales.
- Tablas P0 operativas siguen sin `company_id`.
- Selector/cambio de tenant para usuarios multi-company queda pendiente.
- Fallback por usuario/sucursal debe retirarse cuando las sesiones tenant-aware esten estabilizadas.

Siguiente fase recomendada:

- Fase 2G: validacion runtime real de login, `/api/tenant/current`, `user_companies`, sesiones con `active_company_id`, dashboard y sucursales antes de migrar tablas P0.

## 2026-05-13 - Fase 2G / validacion runtime tenant-aware

Tipo: validacion runtime y documentacion.

Objetivo:

- Confirmar que el backend reiniciado desde la rama actual crea sesiones tenant-aware.
- Validar `/api/tenant/current` sin token y con token valido.
- Validar compatibilidad con dashboard y sucursales.
- Decidir GO/NO-GO antes de migrar tablas P0.

Documento creado:

- `docs/ERP_TENANT_RUNTIME_VALIDATION_2G.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Validacion ejecutada:

- Flyway V39 confirmado por SQL.
- Company `DEFAULT` activa confirmada.
- `branches`: `5/5` con `company_id`.
- `user_companies`: `14` registros.
- Reinicio backend de proceso viejo a proceso nuevo en `8090`.
- `/api/health`: `200`.
- `/api/tenant/current` sin token: `401`.
- Login `qa.admin@local.test`: OK.
- Login `qa.vendedor.centro@local.test`: OK.
- `/api/tenant/current` con token admin: `companyId=1`, `branchId=4`, `branchCode=QA_CTR`.
- Dashboard: OK.
- Branches activas: OK.
- Sesion nueva `qa.admin` confirmada con `active_company_id=1` y `active_branch_id=4`.
- `.\mvnw.cmd test`: `BUILD SUCCESS`, `14 tests`.

Hallazgos:

- El runtime previo en `8090` no estaba sincronizado con Fase 2F; generaba sesiones con tenant null.
- Despues del reinicio limpio, sesiones nuevas ya guardan tenant activo.
- `qa.sinpermisos@local.test`, `qa.reportes@local.test` y `qa.soporte@local.test` no existen en la base runtime actual; por eso fallan con 403.
- Existen sesiones antiguas con `active_company_id=NULL`; fallback compatible aceptado temporalmente.

Decision:

- `GO tecnico condicionado` para runtime tenant-aware.
- `NO-GO` para migrar primera tabla P0 hasta completar dataset QA y repetir smoke de permisos/reportes/soporte.

Siguiente fase recomendada:

- Fase 2H: completar dataset QA de usuarios faltantes, asegurar `user_companies` para usuarios creados despues de V39, revocar/expirar sesiones legacy si se requiere, y repetir validacion runtime antes de tocar P0.

## 2026-05-13 - Fase 2H / usuarios QA tenant-aware

Tipo: SQL QA y documentacion, sin cambios productivos.

Objetivo:

- Completar dataset QA tenant-aware para perfiles faltantes.
- Preparar usuarios `qa.sinpermisos`, `qa.reportes` y `qa.soporte` antes de migrar tablas P0.
- Asegurar company DEFAULT, branch QA_CTR, `user_companies` y sesiones legacy revocadas.

Archivos creados:

- `docs/qa/06-usuarios-tenant-qa.sql`

Archivos actualizados:

- `docs/qa/README.md`
- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_RUNTIME_VALIDATION_2G.md`

Alcance del script:

- Crea/reactiva `qa.reportes@local.test`, `qa.sinpermisos@local.test`, `qa.soporte@local.test`.
- Resetea password QA `{noop}Qa12345!`.
- Asigna sucursal `QA_CTR`.
- Asegura branches QA bajo company `DEFAULT`.
- Inserta/actualiza `user_companies`.
- Inserta/actualiza `user_branches`.
- Reasigna roles `REPORTS`, `NO_ACCESS`, `SUPPORT_TECH`.
- Revoca sesiones legacy de esos correos para forzar nuevo login tenant-aware.

Pruebas:

- No aplica `.\mvnw.cmd test`: solo se modificaron docs y SQL QA.
- SQL no ejecutado en esta fase para evitar modificar runtime sin aprobacion explicita.

Riesgos pendientes:

- Ejecutar el script en QA y capturar evidencia SQL.
- Repetir login de usuarios faltantes.
- Confirmar que nuevas sesiones tengan `active_company_id` y `active_branch_id`.

Decision:

- P0 sigue `NO-GO` hasta ejecutar `06-usuarios-tenant-qa.sql` y repetir smoke 2G.

## 2026-05-13 - Fase 2I / runtime smoke tenant users

Tipo: validacion runtime real con SQL QA aplicado.

Objetivo:

- Ejecutar `docs/qa/06-usuarios-tenant-qa.sql`.
- Validar usuarios QA tenant-aware.
- Confirmar sesiones con `active_company_id` y `active_branch_id`.
- Validar permisos negativos, reportes y soporte antes de P0.

Documento creado:

- `docs/ERP_TENANT_RUNTIME_VALIDATION_2I.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`

Validacion ejecutada:

- SQL QA `06-usuarios-tenant-qa.sql` aplicado correctamente.
- Usuarios `qa.sinpermisos`, `qa.reportes`, `qa.soporte` activos.
- Los tres usuarios quedan en `QA_CTR`, company `DEFAULT`, con `user_companies=YES`.
- Sesiones legacy de esos tres usuarios revocadas.
- Login OK para `qa.admin`, `qa.sinpermisos`, `qa.reportes`, `qa.soporte`.
- `/api/tenant/current` OK para los cuatro usuarios.
- Dashboard y sucursales OK.
- `/api/users` devuelve 403 esperado para `qa.sinpermisos` y `qa.reportes`.
- `/api/users` OK para `qa.admin` y `qa.soporte`.
- Reportes OK para `qa.reportes` y `qa.soporte`.
- Reportes 403 esperado para `qa.sinpermisos`.
- Sesiones nuevas de usuarios QA con `active_company_id=1`, `active_branch_id=4`.
- Logs backend sin `500`, `ERROR`, CORS, auth inesperado ni errores tenant en tramo revisado.
- Logs frontend sin errores relevantes en tramo revisado.
- `.\mvnw.cmd test`: `BUILD SUCCESS`, `14 tests`.

Riesgos pendientes:

- Existen sesiones legacy de `qa.admin` con tenant null.
- Todavia no existe dataset Empresa A/B para afirmar aislamiento cross-company real.
- Branches/reportes aun no deben considerarse tenant P0 final.

Decision:

- `GO condicionado` para iniciar primera P0 de bajo riesgo.
- Mantener fuera de alcance ventas, pagos, live y reportes.

Siguiente fase recomendada:

- Fase 2J: seleccionar primera tabla P0 de bajo riesgo, proponer migracion/backfill/rollback y preparar QA Empresa A/B antes de declarar aislamiento SaaS real.

## 2026-05-13 - Fase 2J / customers tenant-aware

Tipo: implementacion incremental P0 de bajo riesgo.

Objetivo:

- Convertir `customers` en primera tabla operativa tenant-aware.
- Agregar `company_id` obligatorio con backfill desde `branches.company_id`.
- Filtrar endpoints directos de clientes por company activa.
- Mantener ventas, pagos, live y reportes fuera de alcance.

Cambios realizados:

- Migracion `V40__customers_tenant_company.sql`.
- `Customer` ahora referencia `Company`.
- `CustomerRepository` agrega consultas tenant-aware y conserva metodos legacy.
- `CustomerService` resuelve tenant activo, valida branch-company y usa consultas por `company_id`.
- Pruebas unitarias `CustomerServiceTests`.
- Documento `docs/ERP_CUSTOMERS_TENANT_MIGRATION.md`.

Pruebas:

- `.\mvnw.cmd test`: `BUILD SUCCESS`, `18 tests`.
- Runtime local `localhost:8090`: health OK, login `qa.admin` OK, `/api/tenant/current` OK.
- Runtime customers: crear/listar/buscar/actualizar/desactivar cliente QA en branch `QA_CTR`.

Riesgos pendientes:

- Falta dataset Empresa A/B para fuga cross-company real.
- Direcciones/historial de cliente siguen P1.
- Modulos que referencian `customers` desde ventas/pagos/reportes siguen fuera de alcance.

Decision:

- `GO condicionado` para siguiente P0 de bajo riesgo.
- `NO-GO` para ventas, pagos, live y reportes.

## 2026-05-13 - Fase 2K / items tenant-aware

Tipo: implementacion incremental P0 de inventario.

Objetivo:

- Convertir `items` en segunda tabla operativa tenant-aware.
- Agregar `company_id` obligatorio con backfill desde `branches.company_id`.
- Filtrar endpoints directos de inventario por company activa.
- Mantener ventas, pagos, live y reportes fuera de alcance.

Cambios realizados:

- Migracion `V41__items_tenant_company.sql`.
- Migracion `V42__items_company_unique_scope.sql`.
- `Item` ahora referencia `Company`.
- `ItemRepository` agrega consultas tenant-aware y conserva metodos legacy.
- `ItemService` resuelve tenant activo, valida branch-company y usa consultas por `company_id`.
- Pruebas unitarias `ItemServiceTests`.
- Documento `docs/ERP_ITEMS_TENANT_MIGRATION.md`.

Pruebas:

- `.\mvnw.cmd test`: `BUILD SUCCESS`, `22 tests`.
- Runtime local `localhost:8090`: login `qa.admin` OK, `/api/tenant/current` OK.
- Runtime items: crear item QA previo, actualizar item `27`, lookup por codigo, lookup por QR y listar inventario de branch `QA_CTR`.

Riesgos pendientes:

- Falta dataset Empresa A/B para fuga cross-company real.
- Consumidores legacy de items en ventas/pagos/live/reportes/paquetes/envios siguen fuera de alcance.
- Tablas relacionadas como `batches`, `storage_locations` y catalogos aun requieren decision tenant por modulo.

Decision:

- `GO condicionado` para siguiente P0 no financiera de bajo riesgo.
- `NO-GO` para ventas, pagos, live y reportes.

## 2026-05-17 - Fase 2L / batches tenant-aware plan

Tipo: diseno tecnico/documentacion, sin implementacion.

Objetivo:

- Preparar implementacion futura de lotes tenant-aware.
- Analizar riesgos de `batches`, `batch_classification_details` e integracion con `items`.
- Definir migracion propuesta `V43__batches_tenant_company.sql`.
- Mantener fuera de alcance ventas, pagos, live, reportes, frontend y migraciones reales.

Documento creado:

- `docs/ERP_BATCHES_TENANT_IMPLEMENTATION_PLAN.md`

Documentos actualizados:

- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Hallazgos:

- `batches` no tiene `company_id`.
- `batches.folio` mantiene unicidad global.
- `BatchRepository.findByFolio`, `existsByFolio` y `findByBranchIdOrderByCreatedAtDesc` no filtran company.
- `BatchService.findEntity` usa `findById` global.
- `itemCount` y cancelacion usan items por `batch_id` sin filtro company.
- `batch_classification_details` puede mantenerse sin `company_id` si solo se accede desde batch tenant-validado.

Pruebas:

- No aplica `.\mvnw.cmd test`: no se modifico codigo ni migraciones.

Decision:

- `GO documental` para preparar Fase 2M.
- `NO-GO` para implementacion hasta crear rama/runtime especifico y ejecutar QA.

## 2026-05-17 - Fase 2M / batches tenant-aware runtime

Tipo: implementacion incremental P0 no financiera.

Objetivo:

- Convertir `batches` en tabla tenant-aware con `company_id`.
- Reemplazar folio global por folio unico por company.
- Tenantizar endpoints directos de lotes sin tocar ventas, pagos, live, reservaciones ni reportes.
- Mantener compatibilidad con company `DEFAULT`.

Cambios realizados:

- Migracion `V43__batches_tenant_company.sql`.
- `Batch` ahora referencia `Company`.
- `BatchRepository` agrega consultas por `company_id`.
- `BatchService` resuelve tenant activo, valida branch-company y usa batch-company para id/folio/listados.
- `generateUniqueFolio` ahora es scoped por company.
- `itemCount` usa `items.company_id`.
- Cancelacion bloquea mismatch `item.company_id != batch.company_id`.
- `batch_classification_details` se mantiene sin `company_id`, accediendo solo desde batch tenant-validado.
- Se agregaron pruebas `BatchServiceTests`.
- Se creo `docs/ERP_BATCHES_TENANT_MIGRATION.md`.

Pruebas:

- `.\mvnw.cmd test`: `BUILD SUCCESS`.
- Resultado Maven: `Tests run: 28, Failures: 0, Errors: 0, Skipped: 0`.
- Flyway valido `43 migrations`.
- Runtime local `localhost:8090`: login `qa.admin` OK, `/api/tenant/current` OK.
- Runtime batches: crear lote, recibir, clasificar, reconciliar, buscar por id, buscar por folio, listar por branch y cancelar lote sin items.
- Runtime compatibilidad: customers/items siguen respondiendo.

Riesgos pendientes:

- Falta dataset Empresa A/B para fuga cross-company real.
- `suppliers` sigue sin `company_id`.
- `batch_classification_details` depende de acceso indirecto desde batch tenant-validado.
- Consumidores legacy de batches en ventas/pagos/live/reportes siguen fuera de alcance.

Decision:

- `GO condicionado` para batches tenant-aware dentro de `DEFAULT`.
- `NO-GO` para declarar SaaS real o tocar ventas/pagos/live/reportes.

