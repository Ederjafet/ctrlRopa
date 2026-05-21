# ERP - Riesgos operativos

Fecha: 2026-05-12

## Escala

Severidad:

- CRITICO: puede afectar dinero, seguridad, inventario o continuidad operativa.
- ALTO: puede afectar un flujo principal o generar reproceso fuerte.
- MEDIO: afecta eficiencia, soporte o trazabilidad parcial.
- BAJO: afecta claridad o mantenimiento sin detener operacion.

Probabilidad:

- ALTA: ya se observo o es probable por estructura actual.
- MEDIA: depende de uso, datos o permisos.
- BAJA: posible pero no frecuente.

## Matriz de riesgos

| Riesgo | Severidad | Probabilidad | Impacto operacional | Mitigacion | Rollback |
|---|---|---|---|---|---|
| Venta sin validacion clara | CRITICO | MEDIA | Venta incompleta, prenda mal afectada, diferencia de caja. | Validaciones accionables, regresion de venta puerta, mensajes claros. | Revertir pantalla/servicio afectado y validar item/pago. |
| Pago/anulacion con error | CRITICO | MEDIA | Saldo o caja incorrecta. | QA especifico de pagos, auditoria financiera, permisos revisados. | Revertir backend/frontend y revisar movimientos financieros. |
| Permisos incompletos | CRITICO | ALTA | Usuario ejecuta accion indebida o queda bloqueado. | Matriz endpoint-permiso, pruebas con usuario permitido/no permitido. | Revertir cambio de permisos o rol; validar sesion. |
| Seguridad dispersa por servicio | CRITICO | ALTA | Endpoint sin `assertCan` podria quedar expuesto. | Fase de seguridad dedicada, pruebas por controlador, revision `SecurityConfig.java`. | Revertir cambio de seguridad; bloquear ruta si aplica. |
| Lote recibido con mala captura | ALTO | MEDIA | Inventario incorrecto desde origen. | Validaciones de cantidad/calidad/proveedor, QA de recepcion. | Revertir recepcion si existe operacion; si no, correccion controlada. |
| Live asociado incorrectamente | ALTO | MEDIA | Reservas quedan en live equivocado o sin contexto. | Seleccion clara, historial paginado, pruebas de crear/cerrar live. | Reabrir/corregir reserva si existe soporte; si no, ajuste manual documentado. |
| Cancelaciones sin autorizacion formal | ALTO | ALTA | Perdida de trazabilidad y posibles errores operativos. | Flujo futuro solicitud/aprobacion, motivo obligatorio, auditoria. | Revertir cancelacion solo con procedimiento administrativo. |
| Historiales inmanejables | MEDIO | ALTA | Pantallas lentas o dificiles de operar. | Paginacion/filtros por fase futura. | Revertir pantalla o ocultar historial pesado temporalmente. |
| Logs tecnicos visibles a usuarios operativos | MEDIO | MEDIA | Confusion, exposicion de informacion tecnica. | Perfil tecnico separado, permisos y UX de soporte. | Ocultar ruta/menu de logs. |
| Codificacion rota en textos | MEDIO | MEDIA | Mala experiencia, mensajes poco confiables. | Barridos de mojibake, usar UTF-8, QA visual. | Revertir archivo o corregir texto. |
| Artefactos no rastreados en Git | MEDIO | ALTA | Release con archivos no controlados o ruido en diff. | Limpiar/ignorar antes de release; checklist Git. | No incluir artefactos; restaurar working tree limpio. |
| Auditoria insuficiente | ALTO | ALTA | No se puede explicar quien hizo una accion sensible. | Fase de auditoria, eventos de negocio, revision de logs. | No aplica rollback completo; se mitiga hacia adelante. |
| Fuga de datos entre companias | CRITICO | ALTA si se habilita multi-compania sin tenant scope | Una empresa podria ver clientes, ventas, pagos, inventario o reportes de otra. | Diseno Fase 2A, `company_id` obligatorio, validacion backend, QA negativo por compania. | Desactivar acceso multi-compania, volver a compania default y restaurar backup si hubo migracion. |
| Permisos globales aplicados a varias companias | CRITICO | MEDIA | Un usuario podria heredar permisos administrativos en empresas donde no debe operar. | Roles/permisos por compania, `AccessService` tenant-aware, pruebas con usuario multi-compania. | Revertir asignaciones por compania y bloquear usuario afectado. |
| Reportes sin filtro tenant | CRITICO | MEDIA | Totales financieros o inventario mezclados entre empresas. | Filtros obligatorios por `company_id`, indices compuestos, QA de reportes cruzados. | Bloquear reportes multi-compania y corregir consultas. |
| Soporte tecnico con acceso excesivo | ALTO | MEDIA | HPSQ-SOFT podria ver u operar datos sensibles sin control. | Modo soporte auditado, justificacion, caducidad y permisos limitados. | Revocar sesiones soporte y auditar acciones. |
| Consola SaaS visible para clientes | CRITICO | MEDIA si se mezclan roles | Cliente podria administrar otras empresas o ver informacion global. | Rutas privadas, roles `SAAS_*`, pruebas negativas y auditoria. | Ocultar/deshabilitar consola y revocar permisos SaaS. |
| Suspension comercial mal aplicada | ALTO | MEDIA | Empresa suspendida podria seguir operando o empresa activa quedar bloqueada. | Validar estado de compania en login/endpoints y QA reactivacion. | Revertir estado desde historial y revalidar acceso. |
| Limites de plan solo en frontend | ALTO | MEDIA | Cliente podria exceder usuarios, sucursales o modulos por API. | Validacion backend contra `company_subscriptions`. | Desactivar recurso excedente con proceso administrativo. |
| Soporte HPSQ-SOFT modifica datos financieros | CRITICO | BAJA/MEDIA | Riesgo de saldos/caja incorrectos y responsabilidad operativa. | Prohibir por defecto; herramienta auditada y aprobacion formal si se requiere. | Auditoria, reversa operacional y bloqueo de sesion soporte. |
| Endpoint P0 sin tenant validation | CRITICO | ALTA durante migracion | Un id directo, folio o branchId podria exponer datos de otra empresa. | Usar `ERP_TENANT_ENDPOINT_MATRIX.md`, bloquear release si endpoint P0 queda sin `company_id`. | Deshabilitar multi-compania o bloquear endpoint afectado. |
| Tabla P0 sin company_id/backfill | CRITICO | ALTA durante migracion | Datos existentes podrian quedar huerfanos o mezclados. | Usar `ERP_TENANT_TABLE_MATRIX.md`, conteos antes/despues, migracion gradual. | Restaurar backup o mantener columna nullable hasta corregir. |
| Accion HPSQ-SOFT sin auditoria SaaS | CRITICO | MEDIA | No se podria explicar quien suspendio, cambio plan o accedio a soporte. | Usar `ERP_SAAS_AUDIT_ACTIONS_MATRIX.md`, motivo y doble confirmacion cuando aplique. | Revocar permisos SaaS y suspender consola. |
| CurrentTenantContext incompleto | CRITICO | MEDIA durante implementacion | Servicios podrian validar usuario pero no company/branch/plan, dejando huecos cross-company. | Diseno Fase 2C, tenant resolver central, pruebas negativas. | Bloquear endpoints tenant o revertir foundation. |
| Cache o logs sin company context | ALTO | MEDIA | Datos/logs de una empresa podrian verse en otra o soporte podria analizar informacion equivocada. | Reglas de enforcement tenant-aware, cache key con companyId, logs sanitizados. | Desactivar cache o filtros afectados. |
| Company suspendida opera con token previo | CRITICO | MEDIA | Cliente suspendido podria seguir vendiendo/cobrando. | Validar estado company en cada request P0 y revocar sesiones al suspender. | Revocar sesiones y bloquear company. |
| Bootstrap tenant parcialmente aplicado | ALTO | MEDIA durante Fase 2D | Si la migracion queda aplicada sin validar runtime, sucursales o login podrian fallar por `company_id`. | Smoke QA inmediato de Flyway, login, `/api/tenant/current`, sucursales y dashboard. | Revertir rama o restaurar backup antes de activar multi-compania real. |
| Runtime backend no sincronizado con rama tenant | ALTO | MEDIA durante Fase 2E | QA podria validar un proceso viejo y tomar decisiones incorrectas sobre `/api/tenant/current`. | Reiniciar/desplegar backend, confirmar build/commit/rama y repetir smoke HTTP autenticado. | Detener validacion runtime, volver al ultimo artefacto conocido y documentar evidencia. |
| Sesion tenant activa inconsistente | CRITICO | MEDIA durante Fase 2F/F2G | Un token podria apuntar a company/branch incorrecta y abrir riesgo cross-company futuro. | Guardar `active_company_id`/`active_branch_id`, validar company activa, branch activa y branch-company por request. | Revocar sesiones afectadas y volver a fallback mono-company hasta corregir. |
| Usuario sin relacion company opera por fallback | ALTO | MEDIA durante transicion | Un usuario legacy podria depender de `users.branch_id` y ocultar un problema de asignacion tenant. | Backfill `user_companies`, pruebas negativas, retirar fallback cuando QA lo permita. | Bloquear usuario o restaurar asignacion default controlada. |
| Usuario multi-company sin selector auditado | ALTO | MEDIA futura | Usuario con varias companies podria operar en la company equivocada si no hay seleccion explicita. | Implementar selector/cambio de tenant auditado antes de habilitar multi-company real. | Limitar usuario a una company hasta completar selector. |
| Dataset QA tenant incompleto | ALTO | ALTA durante Fase 2G | No se pueden validar permisos negativos, reportes y soporte antes de migrar P0. | Restaurar/ejecutar scripts QA controlados y asegurar `user_companies` para usuarios creados despues de V39. | No migrar P0; volver a dataset QA conocido. |
| Sesiones legacy con tenant null | MEDIO | MEDIA durante transicion | Validaciones estrictas SaaS podrian mezclar evidencia de sesiones antiguas con fallback. | Revocar o expirar sesiones previas antes de QA cross-company. | Mantener fallback temporal solo en mono-company. |
| Script QA tenant ejecutado en ambiente incorrecto | ALTO | BAJA/MEDIA | Usuarios de prueba, roles o passwords QA podrian contaminar un ambiente no QA. | Mantener `06-usuarios-tenant-qa.sql` en `docs/qa`, con advertencia NO PROD y respaldo previo. | Restaurar backup o eliminar usuarios `qa.*@local.test`. |
| Primera P0 elegida con alto riesgo | CRITICO | MEDIA durante Fase 2J | Migrar ventas, pagos, live o reportes demasiado pronto puede romper operacion y trazabilidad financiera. | Elegir P0 de bajo riesgo, con backfill simple, pruebas API y rollback. | Revertir rama y restaurar backup antes de liberar. |
| Validacion cross-company sin Empresa B | ALTO | ALTA antes de dataset SaaS | Se podria aprobar tenant sin probar fuga real entre companias. | Crear dataset Empresa A/B antes de declarar aislamiento SaaS. | Mantener sistema en company DEFAULT solamente. |
| Clientes tenant-aware con consumidores legacy | ALTO | ALTA durante Fase 2J+ | Endpoints directos de clientes quedan protegidos, pero ventas/pagos/reportes podrian seguir consultando clientes por id sin company hasta sus fases. | No declarar SaaS real; migrar consumidores por modulo y agregar pruebas negativas. | Revertir consumers migrados o mantener operacion mono-company DEFAULT. |
| Backfill customers incompleto | CRITICO | BAJA/MEDIA durante V40 | Clientes sin `company_id` bloquearian arranque o quedarian huerfanos. | Backfill desde `branches.company_id`, FK y `NOT NULL`; validar Flyway/test. | Restaurar backup o rollback V40 en QA. |
| Telefono cliente con unicidad insuficiente | MEDIO | MEDIA futura | La unicidad actual es por sucursal; si el negocio espera unicidad por company, puede haber duplicados entre sucursales. | Definir politica antes de multi-branch SaaS completo. | Mantener unicidad por sucursal o limpiar duplicados antes de constraint nuevo. |
| Items tenant-aware con consumidores legacy | ALTO | ALTA durante Fase 2K+ | Endpoints directos de inventario quedan protegidos, pero ventas/pagos/live/reportes/paquetes/envios podrian seguir consultando items por id sin company hasta sus fases. | No declarar SaaS real; migrar consumidores por modulo y agregar pruebas negativas. | Revertir consumers migrados o mantener operacion mono-company DEFAULT. |
| Backfill items incompleto | CRITICO | BAJA/MEDIA durante V41 | Items sin `company_id` bloquearian arranque o quedarian huerfanos. | Backfill desde `branches.company_id`, FK y `NOT NULL`; validar Flyway/test. | Restaurar backup o rollback V41/V42 en QA. |
| QR/codigo item scoped por company sin QA A/B | ALTO | MEDIA futura | Se permite repetir QR/codigo entre companies; sin QA cross-company se podria aprobar aislamiento incompleto. | Probar lookup codigo/QR con Empresa A/B antes de SaaS real. | Mantener operacion DEFAULT o restaurar unicidad global si negocio lo exige. |
| Batches sin company_id | CRITICO | ALTA antes de Fase 2M | Lotes pueden consultarse por id/folio/listado sin tenant, exponiendo recepcion, calidad y clasificacion de otra company. | Implementar `batches.company_id`, queries tenant-aware y validacion branch-company. | Mantener batches solo en DEFAULT o bloquear endpoints de lotes multi-company. |
| Folio de lote global | ALTO | MEDIA durante migracion tenant | `findByFolio` global puede resolver lote de otra company y la unicidad no expresa aislamiento SaaS. | Cambiar a `uq_batches_company_folio` y `findByCompanyIdAndFolio`. | Restaurar `uq_batches_folio` solo si no hay duplicados globales. |
| Item/batch company mismatch | CRITICO | MEDIA durante Fase 2M+ | Item de una company podria quedar ligado a lote de otra, contaminando inventario y cancelacion. | Validar `item.company_id = batch.company_id` y branch-company. | Corregir relaciones manualmente desde backup antes de operar. |
| Classification details sin validacion previa | ALTO | MEDIA durante Fase 2M | Detalles de clasificacion pueden exponerse si se consultan por `batch_id` sin validar batch. | Consultar detalles solo desde batch tenant-validado o agregar queries con join company. | Revertir service y bloquear endpoint hasta corregir. |
| Suppliers globales con batches tenant-aware | ALTO | ALTA despues de Fase 2M | Un lote ya es tenant-aware, pero proveedores pueden seguir siendo catalogo global y generar confusion o exposicion futura. | Tenantizar `suppliers` o definirlos como catalogo global administrado antes de SaaS real. | Mantener proveedores QA controlados y no habilitar multi-company real. |
| Batches tenant-aware sin dataset Empresa A/B | ALTO | ALTA despues de Fase 2M | La operacion `DEFAULT` funciona, pero no hay evidencia de fuga cross-company real bloqueada. | Crear dataset Empresa A/B y pruebas negativas por id/folio/branch. | Mantener sistema mono-company DEFAULT. |
| Consumidores legacy de batches | CRITICO | MEDIA despues de Fase 2M | Live, reservaciones, ventas, pagos o reportes podrian usar batch por id sin company cuando se migren sus flujos. | Revisar cada consumidor antes de tocar modulos financieros/live/reportes. | No habilitar esos modulos en SaaS multi-company hasta migrarlos. |
| Dataset Empresa A/B ejecutado sin respaldo | ALTO | MEDIA durante Fase 2N | Datos QA A/B podrian contaminar evidencia o requerir limpieza manual. | Respaldar QA antes de ejecutar `07-empresa-ab-tenant-qa.sql`; script no borra historicos. | Desactivar companies/branches/users A/B o restaurar backup QA. |
| Evidencia A/B sin cerrar sesiones antiguas | MEDIO | MEDIA durante Fase 2N/2O | Un token anterior podria apuntar a tenant viejo y falsear validacion. | Script revoca sesiones A/B; login nuevo obligatorio antes de probar. | Revocar sesiones de usuarios A/B y repetir login. |
| Roles ADMIN/SELLER todavia globales | ALTO | MEDIA durante validacion A/B | Permisos siguen sin scope por company; aislamiento depende del tenant resolver y servicios migrados. | Validar datos por endpoint tenant-aware y no declarar seguridad SaaS completa todavia. | Limitar usuarios A/B a QA y no habilitar SaaS real. |
| Sesiones legacy tenant null persistentes | MEDIO | MEDIA despues de Fase 2O | Sesiones antiguas pueden confundir evidencia o mantener fallback mono-company. | Revocar sesiones `active_company_id IS NULL` antes de release SaaS real. | Cerrar sesiones y repetir login tenant-aware. |
| Aislamiento A/B solo en endpoints directos | ALTO | ALTA antes de SaaS real | Customers/items/batches estan aislados, pero consumers de ventas/pagos/live/reportes no fueron validados. | Mantener esos modulos fuera de alcance y migrarlos por fase. | No habilitar multi-company real para flujos no migrados. |
| I18N parcial en frontend | MEDIO | MEDIA durante migracion UX | LIVE puede mostrar textos traducidos mientras otras pantallas siguen con literales directos, generando experiencia inconsistente. | Migrar pantallas por fases y mantener diccionarios por modulo. | Revertir cambios de i18n en la pantalla afectada. |
| Idioma no persistido | BAJO | MEDIA en fase inicial | Usuario podria cambiar idioma en LIVE y perder preferencia al reiniciar la app. | Definir persistencia de idioma en fase futura. | Mantener espanol como default. |
| Estatus/errores backend no traducidos | MEDIO | MEDIA | Algunos errores o etiquetas pueden mostrarse en idioma distinto al seleccionado. | Centralizar estrategia de errores y status labels en i18n. | Mostrar fallback espanol operativo. |
| Puerto frontend 8081 ocupado por proceso stale | MEDIO | MEDIA en QA local | `npm run web` puede fallar aunque el build/export sea correcto, bloqueando validacion visual. | Liberar proceso `node` antes de smoke web o usar puerto QA alterno documentado. | Cerrar proceso stale y repetir `npm run web`. |
| LIVE metricas sin company_id | CRITICO | MEDIA futura | Viewers, comentarios o engagement de una empresa podrian mezclarse con otra. | Toda tabla/evento/metrica LIVE debe tener `company_id` y validar `CurrentTenantContext`. | Deshabilitar dashboard LIVE analytics y restaurar datos desde backup si hubo mezcla. |
| Tokens Facebook globales o en logs | CRITICO | MEDIA futura | Un token de una empresa podria exponerse o usarse para otra company. | Token por company, cifrado/referencia segura, logs sanitizados y auditoria. | Revocar token, rotar credenciales y bloquear integracion. |
| Eventos LIVE duplicados | ALTO | MEDIA futura | Engagement y conversion pueden inflarse y afectar decisiones comerciales. | Deduplicacion por `company_id`, fuente, tipo y external_event_id. | Recalcular agregados desde eventos crudos depurados. |
| Dependencia Facebook API | ALTO | ALTA futura | Rate limit o cambios API pueden degradar metricas externas. | Operacion LIVE local independiente, adapter desacoplado, backoff y alertas amigables. | Desactivar sincronizacion Facebook y mantener metricas internas. |
| Estado LIVE ambiguo para operador | MEDIO | MEDIA en operacion | Operador podria capturar o cerrar en contexto equivocado si no distingue abierto/activo/cerrado. | Tarjeta de estado operativo, instrucciones de siguiente paso y confirmaciones explicitas. | Revertir UX LIVE-C y operar con checklist manual. |
| Smoke visual LIVE no ejecutado en navegador real | MEDIO | MEDIA en QA local | Build/export puede pasar, pero errores visuales o de click ES/EN podrian no detectarse. | Levantar `8081`, capturar evidencia visual y repetir checklist LIVE-D. | Bloquear metricas runtime/Facebook hasta completar smoke visual. |
| Permisos de log frontend bloqueados | MEDIO | MEDIA en QA local | `npm run web` puede operar sin log persistente o dificultar diagnostico de errores visuales. | Revisar permisos de `C:\HPSQ-SOFT\control-ropa\logs\frontend`. | Ejecutar con usuario autorizado o corregir ACL antes de smoke. |
| Metricas demo confundidas con metricas reales | MEDIO | MEDIA en demos | Usuario comercial u operativo podria interpretar datos simulados como analytics productivos. | Badge `Demo visual`, textos explicitos y documentacion de alcance. | Ocultar panel demo y no avanzar a analytics reales sin backend/eventos tenant-aware. |
| Idioma global parcialmente aplicado | MEDIO | MEDIA durante rollout i18n | El usuario puede cambiar ES/EN en Sistema, pero pantallas no migradas aun conservan literales directos. | Migrar i18n por modulo y documentar pantallas cubiertas. | Mantener espanol como fallback y revertir pantalla afectada si rompe navegacion. |
| LIVE oculta fallas de carga como listas vacias | ALTO | MEDIA en QA/demo | Clientes o prendas pueden parecer inexistentes aunque la causa sea API, token, tenant o branch. | Mostrar `customerLoadIssue`/`itemLoadIssue` y validar logs/API antes de asumir ausencia de datos. | Revertir cambio frontend o volver a cargar despues de logout/login. |
| LIVE concatena 403 secundarios | MEDIO | MEDIA en movil/web | Dos endpoints secundarios pueden mostrar el mismo permiso denegado en un modal duplicado, alarmando al usuario. | Separar errores por recurso y reservar alerta global solo para acceso denegado real a En vivo. | Revertir manejo local y revisar permisos/dataset del usuario afectado. |
| Sesion tenant-aware vieja en LIVE | ALTO | MEDIA en movil/web | Una sesion con `active_company_id`/`active_branch_id` desalineado puede provocar 403 en clientes/prendas aunque el usuario tenga permisos. | Revocar sesiones QA con `08-live-qa-permissions-fix.sql`, forzar relogin y validar `/api/tenant/current`. | Cerrar sesion manualmente, revocar token y repetir login. |
| Permisos QA LIVE incompletos | MEDIO | MEDIA en QA | Usuario QA puede entrar por ruta/cache pero no cargar clientes/prendas o no operar reservas. | Asegurar `DO_LIVE_RESERVATION`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, canal LIVE y user_companies/user_branches. | Ejecutar script QA idempotente y reintentar con usuario correcto. |
| Avisos visuales invasivos en En vivo | BAJO | MEDIA en QA/demo | Banners grandes pueden interrumpir captura y verse poco profesionales en presentacion. | Usar modal compacto para resultados de acciones y mantener errores secundarios en contexto. | Revertir a banner previo si el modal falla en runtime. |
| Detalle de cobro dificil de leer en movil | MEDIO | MEDIA en flujo En vivo -> Pagos | Lista vertical larga aumenta errores del cajero al validar reserva, cliente, prenda y montos. | Agrupar datos en tarjetas responsive sin cambiar calculos ni endpoint. | Revertir solo layout frontend de `app/payments.tsx`. |
| Layout En vivo tablet-first no validado en dispositivos reales | MEDIO | MEDIA durante demo | El layout puede verse bien en export web pero necesitar ajuste fino en Galaxy Tab/iPad reales. | Ejecutar smoke visual 1024x768, 1280x800, Galaxy Tab y iPad antes de demo comercial. | Revertir layout de `app/live.tsx` o forzar stack si hay desbordes. |
| Consola En vivo tablet con informacion excesiva | MEDIO | MEDIA durante operacion | Metricas, linea de tiempo y reservas pueden competir con la captura rapida en tablet. | LIVE-M compacta metricas, resume linea de tiempo y prioriza columna operativa; validar en tablet fisica. | Revertir cambios de `LiveTabletLayout` y compactacion tablet en `app/live.tsx`. |
| Design system LIVE aplicado parcialmente | MEDIO | MEDIA durante evolucion UX | Si solo algunas tarjetas usan componentes LIVE, la pantalla puede seguir mezclando estilos viejos y nuevos. | LIVE-N crea componentes base y migra metricas; planear migracion gradual de estado, reservas y avisos. | Revertir `components/live/LiveCommerceCards.tsx` y uso de `LiveMetricCard` en `app/live.tsx`. |
| Product Spotlight con datos demostrativos | MEDIO | MEDIA durante demo comercial | Indicadores como ultimas piezas o interesados son visuales y podrian interpretarse como metricas reales. | Rotular y explicar que son datos demostrativos hasta tener eventos reales. | Revertir bloque de spotlight/activity feed o esconder indicadores demo. |
| Integraciones Live Commerce sobredimensionadas | ALTO | MEDIA en roadmap | Prometer Facebook/YouTube/Instagram/TikTok sin validar APIs, permisos y limites puede generar deuda y expectativas incorrectas. | Mantener estrategia de adaptadores documentada y no implementar runtime hasta tener QA, permisos y seguridad tenant-aware. | Mantener operacion manual/QA sin adaptadores externos. |
| Estatus de item no normalizado | MEDIO | MEDIA | Comparaciones exactas pueden ocultar prendas disponibles en LIVE. | Normalizar estatus en frontend y formalizar contrato API. | Usar busqueda directa por codigo/QR mientras se corrige contrato. |

## Acciones que deberian auditarse

- Login fallido/bloqueo/desbloqueo.
- Crear/editar/desactivar proveedor.
- Crear/recibir/conciliar/cancelar lote.
- Alta/modificacion de prenda.
- Venta, cancelacion de venta, reserva, cancelacion de reserva.
- Pago/anulacion/aplicacion de saldo.
- Cierre/cancelacion de caja.
- Preparacion/cancelacion de paquete.
- Envio/despacho/resolucion/reapertura.
- Cambios de permisos, roles, usuarios y configuracion de seguridad.
- Alta/edicion/suspension/reactivacion de empresa.
- Cambios de plan, limites y modulos habilitados.
- Acceso soporte HPSQ-SOFT a una empresa.
- Consulta de logs por HPSQ-SOFT.
- Reset/desbloqueo de usuarios cliente desde consola SaaS.
- Cambios de branding por empresa.

## Riesgos criticos actuales

- Permisos incompletos por validacion dispersa.
- Multi-compania sin tenant context seria riesgo CRITICO de fuga de datos.
- Consola SaaS sin separacion de roles HPSQ-SOFT/cliente seria riesgo CRITICO.
- Fase 2B identifica endpoints/tablas P0; implementacion sin esas matrices cerradas seria riesgo CRITICO.
- Fase 2C define foundation tenant; implementacion sin `CurrentTenantContext` central seria riesgo CRITICO.
- Fase 2D introduce bootstrap tenant minimo; ventas/pagos/reportes siguen sin tenant real y no deben considerarse multi-compania.
- Fase 2E detecta riesgo de runtime no sincronizado; no migrar P0 sin evidencia HTTP autenticada.
- Fase 2F agrega sesiones tenant-aware minimas; no habilitar multi-company real hasta validar runtime y permisos por company.
- Fase 2G valida runtime tenant-aware, pero dataset QA incompleto mantiene `NO-GO` para P0.
- Fase 2H prepara script QA tenant-aware; P0 sigue bloqueado hasta ejecutar y validar runtime.
- Fase 2I valida usuarios QA tenant-aware; avanzar solo a primera P0 de bajo riesgo, no financiera.
- Fase 2K convierte items/inventario en segunda P0 tenant-aware; no declarar aislamiento SaaS real hasta probar Empresa A/B y migrar consumidores legacy.
- Fase 2L solo documenta plan de batches; no hay cambio runtime. Implementacion futura debe bloquearse si `findById`/`findByFolio` siguen globales.
- Fase 2M convierte batches en tenant-aware para endpoints directos; aun falta dataset Empresa A/B, proveedores tenant-aware y revision de consumidores legacy.
- Fase 2N crea dataset QA Empresa A/B; el aislamiento real sigue pendiente hasta ejecutar runtime smoke y capturar evidencia.
- Fase 2O valida aislamiento A/B para customers/items/batches directos; SaaS real sigue bloqueado para ventas/pagos/live/reportes.
- LIVE-B documenta metricas/engagement/Facebook; no implementar runtime sin normalizar estados, company_id y eventos internos.
- LIVE-C normaliza UX visual de estados, pero backend sigue con estados actuales `OPEN/ACTIVE/CLOSED`.
- LIVE-D no cierra smoke visual real hasta validar navegador en `8081` con evidencia.
- LIVE-E agrega metricas demo visuales; no representan datos reales y no habilitan Facebook/analytics productivo.
- Refinamiento LIVE i18n global centraliza idioma en Sistema, pero i18n completo del ERP sigue pendiente por modulos.
- Correccion LIVE de permisos evita duplicar 403 secundarios, pero se debe validar en movil cual endpoint falla.
- LIVE-I identifica que 403 de clientes/prendas probablemente es tenant/session, no permiso funcional directo; ejecutar script QA y relogin antes de abrir incidencias backend.
- LIVE-J mejora avisos y detalle de cobro sin tocar backend; requiere smoke visual en movil para confirmar ergonomia.
- LIVE-K reorganiza En vivo como comercio visual tablet-first; validar en tablets reales antes de usarlo como demo comercial formal.
- LIVE-L separa layouts por dispositivo y documenta flujo/adaptadores, pero no habilita integraciones reales ni metricas reales.
- LIVE-M ajusta tablet para operacion comercial real; el riesgo pendiente es validacion tactil en Galaxy Tab/iPad.
- LIVE-N inicia design system y microcopy especializado; el riesgo pendiente es migracion gradual sin refactor masivo.
- LIVE-O acerca `En vivo` a streaming commerce, pero indicadores de spotlight/feed siguen siendo visuales hasta integrar eventos reales.
- LIVE-P separa roles y simula pulso runtime, pero la colaboracion real sigue bloqueada hasta tener eventos backend, roles LIVE y validacion tactil en tablet.
- LIVE-Q corrige safe area y microcopy para demo, pero sigue pendiente smoke visual en Android/tablet/iPad antes de declararlo demo candidate final.
- LIVE-R valida Expo/web y build tecnico tras reinicio, pero demo final sigue condicionado a evidencia fisica mobile/tablet y backend QA para flujo reserva/cobro.
- LIVE-S agrega preferencia local de analiticos; en multi-dispositivo puede haber diferencia visual hasta persistirla por usuario/company.
- LIVE-S muestra producto activo desde la prenda seleccionada, pero no existe sincronizacion realtime entre operadores.
- LIVE-S habilita alta rapida de cliente desde En vivo; queda riesgo de duplicados hasta normalizar telefono y crear flujo formal de interesado.
- LIVE-S solo mitiga reservas falsas con aviso UX; controles reales requieren reglas backend auditadas y liberacion de reservas vencidas.
- Pagos/ventas sin regresion automatizada suficiente.
- Auditoria de negocio todavia parcial.
- Artefactos no rastreados antes de release.
