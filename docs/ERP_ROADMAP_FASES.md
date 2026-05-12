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

Subfases completadas:

- Fase 1A: estabilizacion UX minima.
- Fase 1B: gobernanza ERP.
- Fase 1C: regresion operacional y release flow.

Siguiente subfase recomendada:

- Fase 1D: datos QA, evidencia de regresion y usuarios por rol.

## Fase 2 - Homologacion UX/UI

Prioridad operacional: ALTA  
Esfuerzo estimado: ALTO  
Riesgo de regresion: MEDIO.

Dependencias:

- Fase 1 cerrada.
- Guia UX aprobada.
- Componentes base identificados.

Criterios de salida:

- Uso consistente de `AppBottomModal`, `AppNoticeDropdown`, `AppButton` y estados vacios.
- Mensajes tecnicos no visibles al usuario operativo.
- Pantallas criticas validadas en web/mobile.

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

Criterios de salida:

- Smoke tests por modulo.
- Checklist manual por release.
- Evidencia de pruebas en flujos criticos.

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

