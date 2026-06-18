# ERP - Estandar de evidencias QA

Fecha: 2026-05-12  
Fase: 1F - hardening QA y release governance

## Objetivo

Definir como guardar evidencia QA para que una corrida sea auditable, repetible y util para release management.

## Estructura de carpetas sugerida

```text
evidencias/
  YYYY-MM-DD_fase1f_rcN/
    00-contexto/
    01-smoke-tecnico/
    02-smoke-operacional/
    03-smoke-visual/
    04-smoke-seguridad/
    05-defectos/
    06-logs/
    07-decision-release/
```

## Naming convention

Formato:

```text
YYYYMMDD_HHMM_<ambiente>_<usuario>_<flujo>_<resultado>.<ext>
```

Ejemplos:

- `20260512_1015_QA_qa-admin_login_APROBADO.png`
- `20260512_1040_QA_qa-caja_pago_SEV-1.mp4`
- `20260512_1105_QA_backend_logs_SEV-2.txt`

## Evidencia minima requerida

| Tipo | Requerido cuando | Contenido minimo |
|---|---|---|
| Screenshot | Todo flujo visual/operativo. | Pantalla, usuario/ambiente si es visible, resultado. |
| Log backend | Error tecnico, 4xx/5xx, fallo de integracion. | Hora, endpoint, status, mensaje relevante. |
| Video | Defecto intermitente o flujo largo. | Inicio, pasos, fallo, cierre. |
| Execution log | Toda corrida. | Fase, rama, ambiente, flujos, decision. |
| Known issue | Defecto aceptado temporalmente. | Severidad, workaround, responsable. |

## Evidencia obligatoria para flujos criticos

- Login/auth: screenshot de login exitoso y fallo controlado.
- Ventas: captura antes/despues del registro y evidencia de total.
- Pagos: captura de metodo, monto y confirmacion.
- Caja: captura de totales y cierre si aplica.
- Permisos: captura de usuario permitido y usuario bloqueado.
- Inventario/lotes: captura de prenda/lote antes y despues si hay cambio.
- Live/reservaciones: captura de live seleccionado, reserva y cierre si aplica.

## Retencion sugerida

- QA local: conservar por fase hasta cierre de release.
- RC: conservar minimo 90 dias.
- PROD/hotfix: conservar minimo 180 dias o segun politica fiscal/operativa.

## Reglas

- No guardar datos sensibles reales en evidencias no protegidas.
- No aprobar release sin evidencia de flujos criticos.
- Si falta evidencia, registrar el hueco como riesgo en `docs/ERP_KNOWN_ISSUES.md`.
