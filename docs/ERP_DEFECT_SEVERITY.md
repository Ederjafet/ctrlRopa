# ERP - Clasificacion de severidad QA

Fecha: 2026-05-12  
Fase: 1F - hardening QA y release governance

## Objetivo

Definir severidades QA para clasificar defectos, decidir bloqueo de release y relacionar fallas con rollback.

## Severidades

| Severidad | Impacto | Bloquea release | Tiempo esperado | Ejemplos ERP reales | Relacion con rollback |
|---|---|---|---|---|---|
| `SEV-1` | Operacion detenida, dinero/datos/seguridad en riesgo o sistema inaccesible. | Si, siempre. | Atencion inmediata. | Login no funciona; backend no arranca; venta registra cobro incorrecto; usuario sin permiso ejecuta pago/cancelacion; migracion rompe datos. | Rollback inmediato si ocurre en QA/RC/PROD y no hay fix seguro. |
| `SEV-2` | Flujo critico degradado con workaround controlado, o riesgo alto de error operativo. | Si, salvo excepcion formal de Release Manager y QA Director. | Resolver antes de RC o documentar excepcion. | Venta guarda pero no muestra confirmacion; pagos duplicables bajo condicion; live permite cerrar sin aviso; lote recibido sin calidad obligatoria. | Rollback si afecta PROD o si el workaround no es seguro. |
| `SEV-3` | Defecto funcional/UX no critico, sin perdida de datos ni bloqueo operativo. | No por defecto; puede bloquear si se acumula en flujo critico. | Resolver en ciclo planificado. | Texto confuso; reporte secundario con formato incorrecto; boton mal alineado sin afectar accion. | No requiere rollback; se programa fix. |
| `SEV-4` | Defecto menor, documental, cosmetico o mejora no urgente. | No. | Backlog. | Typo en documento; evidencia incompleta no critica; mejora visual menor. | No aplica rollback. |

## Reglas de decision

- Todo defecto en login, ventas, pagos, caja, permisos o backend que impida operar es `SEV-1`.
- Todo defecto que pueda generar dinero/inventario incorrecto es `SEV-1` o `SEV-2`.
- Todo defecto de acceso indebido es `SEV-1`.
- Todo defecto sin evidencia reproducible queda como `PENDIENTE DE VALIDAR`, pero no puede usarse para aprobar release critico.
- Un release candidate no puede avanzar con `SEV-1` abierto.

## Relacion con known issues

Todo defecto aceptado temporalmente debe registrarse en `docs/ERP_KNOWN_ISSUES.md` con:

- severidad,
- impacto,
- workaround,
- responsable,
- decision de bloqueo release.

## Pendiente de validar

- Tiempos SLA reales por equipo/ambiente.
- Herramienta final para registrar defectos fuera de Markdown.
