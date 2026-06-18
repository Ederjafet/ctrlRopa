# ERP LIVE - Feedback QA operacional S

Fecha: 2026-05-20  
Fase: LIVE-S

## Hallazgos atendidos

| Hallazgo | Severidad | Accion | Estado |
|---|---|---|---|
| Analiticos deben poder ocultarse para operacion real | MEDIA | Preferencia local en Sistema | Implementado |
| Producto activo debe ser claro para presentadora | MEDIA | Spotlight muestra codigo, talla y estado | Implementado |
| Cliente no registrado bloquea fluidez | MEDIA | Accion Crear cliente rapido con retorno a En vivo | Implementado parcial |
| Reservas falsas requieren mitigacion | ALTA futura | Aviso operativo y modelo futuro documentado | Parcial/documentado |
| Objetos encimados responsive | MEDIA | Ajustes de wrap/metadata y ocultar visuales demo al apagar analiticos | Implementado parcial |

## Pendientes

- Smoke fisico en Android/tablet/desktop.
- Persistencia backend de preferencia de analiticos.
- Cliente temporal/interesado formal.
- Reglas backend contra abuso de reservas.
- Realtime de producto activo multioperador.

## Decision QA

`GO tecnico condicionado`: cambios acotados, sin backend ni finanzas. Requiere validacion visual y flujo real QA.
