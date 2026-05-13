# ERP - Roadmap por fases

Fecha: 2026-05-12

## Criterios generales

Cada fase debe cerrar con:

- Documentacion actualizada.
- Diff revisado.
- Riesgos registrados.
- QA minimo ejecutado.
- Rollback definido.
- Bitacora actualizada.

## Fase 1 - Estabilizacion y documentacion

Prioridad operacional: ALTA  
Esfuerzo estimado: MEDIO  
Riesgo de regresion: BAJO si se mantiene documental/minimo.

Dependencias:

- Baseline ERP en `main`.
- Rama `develop`.
- Ramas `feature/*` por fase.

Criterios de salida:

- Matrices ERP iniciales completas.
- Definition of Done creada.
- Release checklist creado.
- Ownership matrix creada.
- Riesgos operativos clasificados.
- Regresion operacional documentada.
- Smoke tests minimos documentados.
- Release flow e incident response documentados.
- Ambientes DEV/QA/STAGING/PROD definidos.
- Dataset QA, usuarios por rol y plantilla de evidencia definidos.

Subfases completadas:

- Fase 1A: estabilizacion UX minima.
- Fase 1B: gobernanza ERP.
- Fase 1C: regresion operacional y release flow.
- Fase 1D: datos QA, usuarios por rol y evidencia de regresion.
- Fase 1E: plan y runbook para primera ejecucion QA controlada.
- Fase 1F: hardening de gobernanza QA, severidades, flujos criticos, evidencia, known issues y politica RC.

Siguiente subfase recomendada:

- Fase 1G: ejecutar QA real controlado, registrar evidencia y decidir release candidate.

## Fase 2 - Arquitectura multi-compania, consola SaaS y homologacion UX/UI

Prioridad operacional: CRITICA  
Esfuerzo estimado: ALTO  
Riesgo de regresion: ALTO si se implementa sin tenant context; BAJO en Fase 2A documental.

Dependencias:

- Fase 1 cerrada.
- RC candidato aprobable documentado.
- Modelo multi-compania aprobado antes de cualquier migracion.
- Consola SaaS HPSQ-SOFT aprobada antes de exponer administracion global.
- Roles SaaS separados aprobados antes de crear rutas privadas.
- Guia UX aprobada.
- Componentes base identificados.

Criterios de salida:

- Fase 2A: arquitectura multi-compania documentada.
- Modelo recomendado definido: una sola base, una sola app, `company_id` obligatorio.
- Seguridad tenant documentada.
- Consola SaaS HPSQ-SOFT documentada.
- Roles/permisos SaaS separados de roles ERP cliente.
- Planes, suscripciones, limites y suspension documentados sin implementacion automatica.
- Plan de migracion gradual definido.
- QA de aislamiento multi-compania definido.
- No iniciar migraciones hasta cerrar matriz tabla/endpoints tenant.
- Uso consistente de `AppBottomModal`, `AppNoticeDropdown`, `AppButton` y estados vacios.
- Mensajes tecnicos no visibles al usuario operativo.
- Pantallas criticas validadas en web/mobile.

Subfases:

- Fase 2A: diseno multi-compania / SaaS seguro.
- Fase 2B: matriz endpoint-tabla-tenant antes de implementar.
- Fase 2C: modelo companies, tenant settings y compania default, si se aprueba.
- Fase 2D: tenant context backend y filtros por company.
- Fase 2E: permisos por compania y roles SaaS separados.
- Fase 2F: consola HPSQ-SOFT minima sin tocar operacion financiera.
- Fase 2G: QA cross-company, suspension/reactivacion y limites de plan.
- Fase 2H: homologacion UX/UI sobre base tenant-aware.

Riesgo de seguridad:

- No se debe avanzar a multi-compania funcional sin validar que cada endpoint filtre por `company_id`.
- No se debe exponer consola SaaS a clientes ni mezclar permisos `SAAS_*` con permisos ERP.
- No se debe implementar billing automatico antes de validar suspension/reactivacion y auditoria.

Entregables Fase 2B:

- `ERP_TENANT_ENDPOINT_MATRIX.md`
- `ERP_TENANT_TABLE_MATRIX.md`
- `ERP_SAAS_AUDIT_ACTIONS_MATRIX.md`
- `ERP_TENANT_IMPLEMENTATION_BACKLOG.md`

Criterios de salida Fase 2B:

- Endpoints P0 identificados.
- Tablas P0 identificadas.
- Acciones HPSQ-SOFT auditables clasificadas.
- Backlog tecnico ordenado por dependencia.
- Decision explicita de no implementar aun.

## Fase 3 - Validaciones y alertas

Prioridad operacional: ALTA  
Esfuerzo estimado: ALTO  
Riesgo de regresion: ALTO en ventas, pagos, live y lotes.

Dependencias:

- Fase 2 con estandar UX.
- Matriz de validaciones vigente.

Criterios de salida:

- Ningun boton critico queda sin respuesta.
- Validaciones frontend/backend alineadas.
- Validaciones accionables en flujos principales.

## Fase 4 - Permisos y seguridad

Prioridad operacional: CRITICA  
Esfuerzo estimado: ALTO  
Riesgo de regresion: ALTO.

Dependencias:

- Matriz endpoint-permiso.
- Ownership por modulo.
- Usuarios QA por perfil.

Criterios de salida:

- Cada endpoint sensible tiene permiso esperado.
- Usuario sin permiso recibe respuesta amigable.
- Logs tecnicos solo para perfil tecnico/admin.

## Fase 5 - QA y regresion

Prioridad operacional: CRITICA  
Esfuerzo estimado: ALTO  
Riesgo de regresion: BAJO si es solo pruebas; MEDIO si se ajustan flujos.

Dependencias:

- Flujos criticos documentados.
- Datos QA controlados.
- Usuarios QA por rol.
- Plantilla de evidencia y bitacora de ejecucion.
- Runbook de primera ejecucion QA controlada.
- Severidades QA, flujos criticos, estandar de evidencia, known issues y politica RC.

Criterios de salida:

- Smoke tests por modulo.
- Checklist manual por release.
- Evidencia de pruebas en flujos criticos.
- Reporte de ejecucion QA con decision release.
- Politica RC aplicada sin `SEV-1` abierto.

## Fase 6 - Auditoria y trazabilidad

Prioridad operacional: ALTA  
Esfuerzo estimado: ALTO  
Riesgo de regresion: MEDIO.

Dependencias:

- Seguridad estabilizada.
- Matriz de acciones auditables.

Criterios de salida:

- Eventos de negocio definidos.
- Auditoria de acciones sensibles.
- Consulta de bitacora por perfil correcto.

## Fase 7 - Refactor controlado

Prioridad operacional: MEDIA  
Esfuerzo estimado: ALTO  
Riesgo de regresion: ALTO.

Dependencias:

- QA regresion activo.
- Pantallas criticas cubiertas.

Criterios de salida:

- Pantallas grandes separadas gradualmente.
- Hooks/servicios extraidos sin cambiar comportamiento.
- Duplicacion reducida con pruebas.

## Fase 8 - Optimizacion y performance

Prioridad operacional: MEDIA  
Esfuerzo estimado: MEDIO/ALTO  
Riesgo de regresion: MEDIO.

Dependencias:

- Observabilidad basica.
- Consultas y pantallas lentas identificadas.

Criterios de salida:

- Paginacion en historiales.
- Indices revisados.
- Latencia medida en endpoints criticos.

## Fase 9 - Modulos ERP avanzados

Prioridad operacional: MEDIA  
Esfuerzo estimado: ALTO  
Riesgo de regresion: ALTO.

Dependencias:

- Base estabilizada.
- Seguridad, auditoria, QA y releases maduros.

Criterios de salida:

- Compras/proveedores completos.
- Calidad por proveedor.
- Autorizaciones/cancelaciones.
- Contabilidad/caja avanzada.
- BI/reportes ejecutivos.

