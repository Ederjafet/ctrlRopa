# Demo LIVE SaaS - Checklist

Fecha: 2026-05-18  
Rama: `feature/demo-a-live-saas-presentation`

## Checklist Antes de la Demo

### Ambiente

- [ ] Backend activo.
- [ ] Frontend activo.
- [ ] Puerto frontend confirmado.
- [ ] Healthcheck backend validado.
- [ ] Base QA disponible.
- [ ] Dataset Empresa A/B disponible si se va a mostrar aislamiento.
- [ ] Navegador limpio o sesion privada preparada.
- [ ] Zoom del navegador ajustado.
- [ ] Pantalla limpia, sin ventanas flotantes.

### Usuarios

- [ ] Usuario QA/admin validado.
- [ ] Usuario Empresa A validado si aplica.
- [ ] Usuario Empresa B validado si aplica.
- [ ] Sesiones anteriores cerradas.
- [ ] Passwords demo conocidos y no expuestos en pantalla.

### Flujos Base

- [ ] Login probado.
- [ ] Dashboard abre.
- [ ] Customers abre.
- [ ] Items abre.
- [ ] Batches abre.
- [ ] LIVE abre.
- [ ] No hay errores JS visibles.
- [ ] No hay mojibake.

### LIVE

- [ ] Selector ES/EN probado.
- [ ] Estado operativo LIVE visible.
- [ ] Mensaje de siguiente paso visible.
- [ ] Lives abiertos visibles si hay datos.
- [ ] Confirmacion activar live probada si aplica.
- [ ] Confirmacion cerrar live probada si aplica.
- [ ] Panel de metricas demo visible.
- [ ] Toggle de metricas demo probado.
- [ ] Timeline demo visible.
- [ ] Productos destacados demo visibles.

### SaaS / Tenant

- [ ] Explicacion preparada de tenant-aware.
- [ ] Customers tenant-aware listos para mostrar.
- [ ] Items tenant-aware listos para mostrar.
- [ ] Batches tenant-aware listos para mostrar.
- [ ] Empresa A/B lista si se hara demostracion.
- [ ] Mensaje claro: ventas/pagos/reportes multi-tenant completos siguen en roadmap.

## Riesgos de Demo

| Riesgo | Sintoma | Accion Rapida |
|---|---|---|
| Puerto `8081` ocupado | Frontend no abre | Ejecutar `netstat -ano \| findstr :8081`, cerrar PID o usar puerto alterno |
| Backend apagado | Login/API falla | Levantar backend y validar healthcheck |
| Sesion vencida | Redirige a login o errores 401 | Cerrar sesion e iniciar de nuevo |
| Datos QA faltantes | Pantallas vacias | Usar guion verbal y capturas/documentacion |
| Logs/permisos frontend | Warning al arrancar web | Continuar si frontend abre; registrar riesgo |
| Navegador cacheado | Textos viejos o sesion incorrecta | Recargar duro o abrir ventana privada |
| LIVE sin datos abiertos | Panel operativo vacio | Mostrar panel demo y explicar que no depende de backend realtime |

## Plan B

Si falla el ambiente runtime:

- Mostrar capturas preparadas.
- Mostrar export web como evidencia tecnica.
- Mostrar documentos de arquitectura LIVE.
- Mostrar roadmap.
- Mostrar dataset Empresa A/B desde documentos.
- Mostrar video grabado si existe.
- Evitar improvisar promesas no implementadas.

## Checklist de Cierre

- [ ] Aclarar que metricas LIVE son demo.
- [ ] Aclarar que Facebook real esta en roadmap.
- [ ] Aclarar que SaaS multiempresa aun no esta listo para produccion completa.
- [ ] Reforzar que customers/items/batches ya son tenant-aware.
- [ ] Reforzar roadmap controlado.
- [ ] Registrar preguntas del cliente/equipo.
- [ ] Registrar objeciones y riesgos.

## Recomendacion de Que Mostrar Primero

1. Dashboard.
2. Clientes/inventario/lotes tenant-aware.
3. Aislamiento Empresa A/B.
4. LIVE UX.
5. Multi idioma.
6. Metricas demo.
7. Roadmap.

La demo debe empezar por confianza operacional y terminar con el diferenciador visual.
