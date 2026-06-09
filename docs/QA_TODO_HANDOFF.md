# QA_TODO_HANDOFF

## Objetivo

Checklist operativo para QA manual. Ningun caso debe marcarse como `PASS` sin evidencia. Usar `docs/QA_RESULTS_LOG.md` para registrar resultados reales.

## Usuarios QA

| Usuario | Uso esperado |
| --- | --- |
| `qa.admin@local.test` | Administracion, operador LIVE, UI Kit, sistema y navegacion completa. |
| `qa.vendedor.centro@local.test` | Vendedor con permisos operativos LIVE segun matriz actual. |
| `qa.supervisor.centro@local.test` | Supervision LIVE y monitoreo. |
| `qa.sinpermisos@local.test` | Bloqueo y pruebas negativas. |

## Corrida PRODUCT-D4 REAL

### Instrucciones para QA

- Usar `docs/PRODUCT_D4_REAL_QA_EXECUTION_PLAN.md` como guia de ejecucion.
- Usar `docs/PRODUCT_D4_REAL_QA_TEST_MATRIX.md` como matriz ejecutable.
- Registrar resultados reales en `docs/QA_RESULTS_LOG.md`.
- Adjuntar evidencia en `qa-reports/manual-evidence/` o indicar ruta externa.
- No marcar `PASS` sin screenshot, video o evidencia verificable.
- No incluir passwords reales, `.env` ni secretos en capturas.
- No corregir dentro de la corrida; si hay `FAIL`, registrar fase correctiva sugerida.

### Orden recomendado

1. Arranque DEV/backend y `.env`.
2. Login/sesion.
3. Navegacion/AppShell/permisos.
4. LIVE operador.
5. LIVE vendedor.
6. LIVE supervisor.
7. LIVE sin permisos.
8. Apartados/reservas.
9. Prendas/inventario.
10. UI Kit/diseno visual.
11. I18n.
12. Errores accionables.

### Ambiente y usuarios

- Ambiente: local, QA o staging definido por QA.
- Usuarios: `qa.admin@local.test`, `qa.vendedor.centro@local.test`, `qa.supervisor.centro@local.test`, `qa.sinpermisos@local.test`.
- Datos minimos: LIVE activo, prendas disponibles/apartadas/vendidas, cliente/interesado, catalogos y permisos QA.

### Evidencia requerida

- ID de caso.
- Usuario.
- Ruta.
- Tema y viewport si aplica.
- Resultado real.
- Screenshot/video/ruta de evidencia.
- Comentario QA.

### Matriz resumida

La matriz ejecutable completa esta en `docs/PRODUCT_D4_REAL_QA_TEST_MATRIX.md`. Los casos cubren backend DEV, login, navegacion, LIVE por actor, apartados, inventario, UI Kit, i18n, errores accionables y configuracion segura.

### Donde registrar resultados

Usar `docs/QA_RESULTS_LOG.md` y la plantilla `qa-reports/manual-evidence/PRODUCT-D4-REAL-QA-results-template-20260608.md`.

## Casos de prueba

| ID | Usuario | Ruta | Caso | Pasos | Resultado esperado | Datos necesarios | Estado QA | Resultado real | Evidencia | Severidad si falla |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LIVE-001 | `qa.admin@local.test` | `/live` | Admin opera LIVE completo | Iniciar live; seleccionar prenda disponible; poner al aire; seleccionar cliente; apartar | Flujo opera sin errores, AppShell visible, no acciones falsas | Cliente e item disponible | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-002 | `qa.vendedor.centro@local.test` | `/live` | Vendedor con permiso aparta | Abrir LIVE activo; seleccionar cliente si tiene permiso; confirmar precio; apartar | Puede apartar si tiene `DO_LIVE_RESERVATION`; no ve acciones no permitidas | Live activo con prenda al aire | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-003 | `qa.supervisor.centro@local.test` | `/live` | Supervisor ve cambios sin salir | Entrar antes de cambios; admin cambia prenda/live; esperar polling o refrescar | Vista se actualiza, muestra ultima actualizacion | Dos sesiones/navegadores | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-004 | `qa.sinpermisos@local.test` | `/live` | Sin permisos bloqueado | Iniciar sesion; abrir LIVE | No opera LIVE ni ve acciones utiles | Usuario sin permisos | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-005 | `qa.admin@local.test` | `/live` | Selector filtra disponibilidad | Abrir Buscar prenda; revisar filtro Disponibles; cambiar a Todas | Vendidas/apartadas no aparecen por defecto; con Todas muestran motivo | Items disponibles, apartados y vendidos | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-006 | `qa.vendedor.centro@local.test` + `qa.admin@local.test` | `/live` | Vendedor crea apartado y operador lo ve | Operador permanece en LIVE; vendedor crea apartado; esperar polling | Operador ve nuevo apartado sin salir y aparece aviso discreto | Dos sesiones y live activo | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-007 | `qa.admin@local.test` | `/live` | Paneles accionables consistentes | Intentar apartar sin cliente; sin prenda; prenda ya apartada | Panel contextual claro, no modal innecesario | Estados preparados | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-008 | `qa.admin@local.test` | `/items-create?returnTo=%2Flive` | Alta rapida valida faltantes | Dejar talla/precio/cantidad faltantes; generar | Dialogo accionable, helpers inline, no limpia formulario | Catalogos cargados | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-009 | `qa.vendedor.centro@local.test` | `/live` | Autorizacion precio no simulada | Usar usuario sin `canChangeLivePrice`; revisar precio | Precio solo lectura; no modal de solicitud; no `Solicitud pendiente` | Live activo con prenda al aire | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-010 | `qa.admin@local.test` | `/live` | Cerrar apartado como venta LIVE | Presionar `Cerrar como venta LIVE`; confirmar accion | Apartado cambia a venta LIVE operativa; no registra pago ni caja | LIVE activo con apartado elegible | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-011 | `qa.admin@local.test` | `/live` | Accion inversa clara | Revisar acciones despues de venta LIVE | La accion inversa dice `Deshacer cierre de venta LIVE` | Apartado cerrado como venta LIVE | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-012 | `qa.admin@local.test` | `/live` | Deshacer cierre vuelve a apartado | Presionar `Deshacer cierre de venta LIVE` | Registro regresa a seguimiento como apartado; no registra pago ni caja | Apartado cerrado como venta LIVE | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-013 | `qa.admin@local.test` | `/live` | Cancelar apartado separado | Comparar `Deshacer cierre de venta LIVE` con `Cancelar apartado` | No parecen la misma accion; cancelar mantiene intencion de cancelar apartado | Apartado activo o venta LIVE segun flujo | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-014 | `qa.admin@local.test` | `/live` | Helpers no pago/caja | Revisar ayudas de cerrar, deshacer y cancelar | Los textos aclaran que no registran pago ni caja | Apartado elegible | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-015 | `qa.admin@local.test` | `/live` | Aviso falta prenda preparada accionable | Presionar `CAMBIAR POR PRENDA PREPARADA` sin prenda preparada | Aviso muestra `Buscar prenda`, `Escanear QR`, `Crear prenda rapida` y `Cerrar` | Prenda al aire sin preparada | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-016 | `qa.admin@local.test` | `/live` | Buscar desde aviso prepara cambio | Presionar `Buscar prenda`; seleccionar prenda distinta disponible | Selector abre y la prenda queda preparada para cambio | Prenda disponible distinta | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-017 | `qa.admin@local.test` | `/live` | Crear prenda rapida desde aviso | Presionar `Crear prenda rapida` | Abre alta rapida con retorno a LIVE | Catalogos cargados | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-018 | `qa.admin@local.test` | `/live` | Escanear QR desde aviso | Presionar `Escanear QR` | Abre flujo real de QR o muestra mensaje claro si no esta disponible | Dispositivo/camara o web | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-019 | `qa.admin@local.test` | `/live` | Ningun boton del aviso mudo | Probar Buscar, QR, Crear y Cerrar | Cada accion responde con flujo, mensaje claro o cierre | Aviso abierto | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-020 | `qa.admin@local.test` | `/live` | Pago visible en apartado LIVE | Abrir apartado LIVE con pago registrado | Se ve `Pago registrado`, `Saldo pendiente` y `Estado de pago` si el dato esta disponible | Apartado con pago | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-021 | `qa.admin@local.test` | `/live` | Deshacer cierre bloqueado con pago | Presionar `Deshacer cierre de venta LIVE` en apartado con pago | No ejecuta reversa; muestra autorizacion requerida y aclara que el flujo no esta disponible | Apartado con pago y estado venta LIVE | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-022 | `qa.admin@local.test` | `/live` | Cancelar apartado bloqueado con pago | Presionar `Cancelar apartado` en apartado con pago | No cancela; muestra autorizacion requerida y aclara que el flujo no esta disponible | Apartado con pago | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-023 | `qa.admin@local.test` | `/live` | Sin dato de pago no inventa informacion | Validar usuario/estado sin permiso para pagos si aplica | Muestra estado de pago `No disponible`; no asume ausencia de pago para acciones sensibles | Usuario sin `VIEW_PAYMENTS` o escenario equivalente | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-024 | `qa.admin@local.test` | `/live` | Jerarquia visual de acciones de apartado | Comparar `Ver detalle`, `Cerrar como venta LIVE`, `Deshacer cierre de venta LIVE` y `Cancelar apartado` | Las acciones tienen colores/intencion distintos: neutral, primary, warning/reversa y danger | Apartado con acciones visibles | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-025 | `qa.vendedor.centro@local.test` | `/live` | Vendedor centro no recibe acciones sin permiso | Revisar buscar, escanear, crear, poner al aire, cambiar prenda y apartar | No se habilitan acciones sin permiso real; las acciones bloqueadas muestran feedback o no aparecen como botones mudos | Permisos actuales de vendedor centro | PENDING_QA | Pendiente | Pendiente | S1 |
| LIVE-026 | Arquitectura / producto | Backlog | Separar preparar prenda de controlar prenda al aire | Revisar si vendedor debe preparar prendas sin ponerlas al aire | Si negocio lo requiere, abrir `LIVE-ROLE-A`; no resolver dentro de LIVE-FIX-A | Decision producto/arquitectura | PENDING_QA | Pendiente | Pendiente | S2 |
| LIVE-AUTH-001 | Arquitectura | Docs | Revisar diseno de autorizaciones operativas LIVE | Leer `docs/LIVE_AUTH_A_OPERATIONAL_AUTHORIZATION_DESIGN.md`; revisar casos, permisos, endpoints, eventos y modelo empleado/supervisor | Arquitectura emite GO/NO-GO o ajustes antes de implementar `LIVE-AUTH-B/C`, `LIVE-PAYMENT-GUARD-A`, `LIVE-Z10B` o `LIVE-ROLE-A` | Documento LIVE-AUTH-A | PENDING_ARCH_REVIEW | Pendiente | Pendiente | S1 |
| LIVE-ROLE-001 | Arquitectura / producto | Docs | Revisar auditoria de permisos y capacidades LIVE | Leer `docs/LIVE_ROLE_A_CAPABILITIES_PERMISSIONS_AUDIT.md`; validar matriz accion-permiso, permisos sugeridos y decision sobre vendedor centro | Arquitectura emite GO/NO-GO antes de implementar `LIVE-ROLE-B`, `AUTH-LIVE-PERMISSIONS-A` o cambios RBAC/backend | Documento LIVE-ROLE-A | PENDING_ARCH_REVIEW | Pendiente | Pendiente | S1 |
| UI-001 | `qa.admin@local.test` | `/ui-kit` | Flujo diseno visual | Abrir editor; revisar pasos visibles | Titulo comunica diseno de aplicacion; tecnico queda avanzado | N/A | PENDING_QA | Pendiente | Pendiente | S3 |
| UI-002 | `qa.admin@local.test` | `/ui-kit` | Cambiar colores marca | Cambiar primario/secundario/acento con picker propio | No abre selector nativo como experiencia principal; preview cambia | N/A | PENDING_QA | Pendiente | Pendiente | S3 |
| UI-003 | `qa.admin@local.test` | `/ui-kit` | Restaurar plantilla | Aplicar paleta local; restaurar plantilla | Tema vuelve a preset activo | N/A | PENDING_QA | Pendiente | Pendiente | S3 |
| UI-004 | `qa.admin@local.test` | `/live`, `/customers`, `/ui-kit` | Light/dark | Alternar tema y navegar rutas | Contraste correcto, textos visibles | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| UI-005 | `qa.admin@local.test` | `/ui-kit` | Mobile/tablet editor | Probar ancho movil/tablet | Picker, preview y acciones no se cortan | Dispositivo o responsive | PENDING_QA | Pendiente | Pendiente | S3 |
| I18N-001 | `qa.admin@local.test` | `/system` + `/live` | Espanol | Seleccionar Espanol; abrir LIVE | No aparecen claves crudas ni mezcla grave | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| I18N-002 | `qa.admin@local.test` | `/system` + `/live` | English | Seleccionar English; abrir LIVE | Labels principales en ingles | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| I18N-003 | `qa.admin@local.test` | `/system` + `/live` | Portugues Brasil | Seleccionar pt-BR; abrir LIVE | Labels principales en portugues; sin `undefined` | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| I18N-004 | `qa.admin@local.test` | `/system` + `/live` | Francais | Seleccionar fr; abrir LIVE | Labels principales en frances; sin claves crudas | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| I18N-005 | `qa.admin@local.test` | `/system` + `/live` | Japones | Seleccionar ja; abrir LIVE | No aparece `live.size`, ingles/espanol visible minimo | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| I18N-006 | `qa.admin@local.test` | `/system` + `/live` | Chino simplificado | Seleccionar zh; abrir LIVE | No hay claves crudas ni `undefined` | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| I18N-007 | `qa.admin@local.test` | `/system` + `/live` | Coreano | Seleccionar ko; abrir LIVE | No hay claves crudas ni `undefined` | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| ERR-001 | `qa.admin@local.test` | `/door-reservation` | Backend detenido/error red | Detener backend o simular error; abrir ruta | Mensaje accionable, no `Ocurrio un error interno inesperado` | Ambiente controlado | PENDING_QA | Pendiente | Pendiente | S1 |
| ERR-002 | `qa.admin@local.test` | `/live` | Error refresh LIVE | Interrumpir backend durante refresh | Error limpio y accionable | Ambiente controlado | PENDING_QA | Pendiente | Pendiente | S2 |
| NAV-001 | `qa.admin@local.test` | `/` | Menu categorizado | Revisar sidebar/topbar | Categorias correctas, logout visible | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| NAV-002 | `qa.vendedor.centro@local.test` | `/door-sale` | Venta puerta por permisos | Abrir ruta o menu | Visible solo si permiso/canal aplica | Permisos QA | PENDING_QA | Pendiente | Pendiente | S1 |
| NAV-003 | `qa.admin@local.test` | `/system-security`, `/system-sessions` | Sin layout legacy | Abrir rutas | AppShell/sidebar, sin Menu principal legacy | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| NAV-004 | `qa.admin@local.test` | `/customers`, `/reservations`, `/users` | Rutas operativas migradas | Abrir rutas principales | AppShell, idioma activo, light/dark | N/A | PENDING_QA | Pendiente | Pendiente | S2 |
| SEC-001 | DBA/DevOps | Backend local/QA | Variables backend seguras | Definir `CONTROL_ROPA_DB_PASSWORD`; iniciar backend; ejecutar health/login smoke | Backend arranca sin password versionado; DB conecta por env var | Secret configurado fuera del repo | PENDING_QA | Pendiente | Pendiente | S1 |
| SEC-002 | DBA/DevOps | Git workspace | `.env` no versionado | Crear `.env` local con valores reales; ejecutar `git status --short` | `.env` no aparece; `.env.example` queda versionado como plantilla | `.env` local temporal | PENDING_QA | Pendiente | Pendiente | S1 |
| SEC-003 | Dev/QA tecnico | Backend local DEV | Script DEV seguro | Copiar `.env.example` a `.env`; configurar password local; ejecutar `./scripts/dev-backend.sh` en Git Bash o `scripts\dev-backend.cmd` en CMD | Backend arranca cargando `.env`; password no se imprime; `.env` no queda staged | `.env` local no versionado | PENDING_QA | Pendiente | Pendiente | S1 |
| SEC-CONFIG-A1-QA-01 | Dev/QA tecnico | Backend local DEV | Validar arranque backend DEV con `.env` local | Copiar `.env.example` a `.env`; configurar `CONTROL_ROPA_DB_PASSWORD`; ejecutar `./scripts/dev-backend.sh`; confirmar backend en 8090; ejecutar `curl -i http://localhost:8090/api/me`; ejecutar `git status` | Backend levanta; `/api/me` responde HTTP 401 esperado; `.env` no aparece en git status | `.env` local no versionado | DEV_VALIDATED / PENDING_QA | DEV validado localmente; QA formal pendiente | Pendiente | S1 |
| GOV-001 | Arquitectura | Docs gobierno | Compuerta arquitectura backlog | Revisar `CODEX_AUTONOMOUS_CLOSURE_RUNBOOK.md`; seleccionar pendiente sensible de ejemplo; confirmar que Codex debe entregar handoff sin ejecutar | Bloques sensibles requieren aprobacion previa; bloques bajos pueden ejecutarse controladamente | Docs PROJECT-GOV-B1 | PENDING_QA | Pendiente | Pendiente | S1 |

## Reglas de evidencia

- Screenshot o video por caso visual.
- Usuario, ruta, tema y viewport visibles o anotados.
- Para fallos, incluir severidad y pasos exactos.
- No usar `PASS` si el caso no fue ejecutado.
