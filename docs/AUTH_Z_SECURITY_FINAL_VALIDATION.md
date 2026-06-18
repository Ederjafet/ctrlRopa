# AUTH-Z - Cierre integral de seguridad AUTH

Fecha: 2026-05-28  
Rama esperada: `feature/auth-z-security-final-validation`  
Tipo: cierre documental, orquestacion QA, evidencia operativa

## Objetivo

Cerrar integralmente el bloque AUTH con una validacion automatica que consolida las fases:

- AUTH-A: login seguro, bloqueo `NO_ACCESS`, permisos efectivos y sesion unica.
- AUTH-F: RBAC, enforcement P0, hardening cross-tenant y suite negativa SaaS.
- AUTH-G: auditoria de eventos de seguridad.
- AUTH-H: consulta protegida de auditoria.
- AUTH-I/I2: UI minima y permiso `VIEW_SECURITY_AUDIT`.
- AUTH-J1: retencion y cleanup.
- AUTH-J2: resumen estadistico.
- AUTH-J3: dashboard visual.
- AUTH-J4: alertas.
- AUTH-J5: export CSV de eventos y alertas.

AUTH-Z no agrega features nuevas, no crea migraciones, no cambia roles productivos y no modifica seguridad existente. Solo orquesta smokes, genera evidencia y deja checklist de salida.

## Script final

Script:

`docs/qa/99-auth-z-final-security-smoke.sh`

Ejemplo Git Bash:

```bash
API_BASE_URL=http://localhost:8090 docs/qa/99-auth-z-final-security-smoke.sh
```

El script genera:

- `qa-reports/AUTH-Z-final-security-report-YYYYMMDD-HHMMSS.md`
- `qa-reports/AUTH-Z-final-security-report-YYYYMMDD-HHMMSS.csv`

## Smokes encadenados

| Fase | Script | Cobertura |
|---|---|---|
| AUTH-F6 | `docs/qa/10-auth-f6-saas-negative-regression-smoke.sh` | QA_A/QA_B/DEFAULT aislados, token invalido, branch/cross-tenant bloqueados |
| AUTH-H | `docs/qa/11-auth-h-security-audit-smoke.sh` | Auditoria protegida, NO_ACCESS auditado, token revocado auditado |
| AUTH-I2 | `docs/qa/12-auth-i2-view-security-audit-smoke.sh` | `VIEW_SECURITY_AUDIT`, soporte 200, admin tenant 403 |
| AUTH-J2 | `docs/qa/13-auth-j2-security-audit-summary-smoke.sh` | Summary 200 para soporte y 403 para usuario sin permiso |
| AUTH-J4 | `docs/qa/14-auth-j4-security-alerts-smoke.sh` | Alertas 200 para soporte y 403 para usuario sin permiso |
| AUTH-J5 | `docs/qa/15-auth-j5-security-audit-export-smoke.sh` | Export CSV 200 soporte, 403 admin, sin `password` ni `sessionToken` |

## Checklist minimo de salida

AUTH-Z valida, por composicion de smokes:

- `qa.sinpermisos@local.test` queda bloqueado.
- La sesion unica invalida token anterior.
- QA_A no ve QA_B.
- QA_B no ve QA_A.
- DEFAULT no se filtra hacia QA_A/QA_B.
- Usuario sin permiso recibe `403`.
- `qa.soporte@local.test` puede consultar auditoria.
- `qa.a.admin@local.test` no puede consultar auditoria.
- `GET /api/security/audit-events/summary` responde `200` para soporte.
- `GET /api/security/audit-events/alerts` responde `200` para soporte.
- Exports CSV responden `200` para soporte.
- Exports CSV responden `403` para admin sin permiso.
- Exports CSV no contienen `password` ni `sessionToken`.

## Reporte consolidado

El reporte Markdown y CSV de AUTH-Z incluye:

- prueba;
- modulo;
- valor esperado;
- valor recibido;
- estatus `PASS`/`FAIL`/`SKIP`;
- observacion;
- timestamp;
- API usada.

Cada smoke individual conserva ademas su propio reporte bajo `qa-reports/`.

## Evidencia ejecutada

Ejecucion local Git Bash:

```bash
API_BASE_URL=http://localhost:8090 docs/qa/99-auth-z-final-security-smoke.sh
```

Resultado:

- AUTH-F6: `PASS=20`, `FAIL=0`, `SKIP=5`
- AUTH-H: `PASS=9`, `FAIL=0`, `SKIP=0`
- AUTH-I2: `PASS=10`, `FAIL=0`, `SKIP=0`
- AUTH-J2: `PASS=9`, `FAIL=0`, `SKIP=0`
- AUTH-J4: `PASS=13`, `FAIL=0`, `SKIP=0`
- AUTH-J5: `PASS=13`, `FAIL=0`, `SKIP=0`
- Consolidado AUTH-Z: `PASS=6`, `FAIL=0`, `SKIP=0`

Reportes generados:

- `qa-reports/AUTH-Z-final-security-report-20260528-093110.md`
- `qa-reports/AUTH-Z-final-security-report-20260528-093110.csv`

## Criterio GO/NO-GO

GO tecnico condicionado si:

- el smoke AUTH-Z termina con `FAIL=0`;
- los scripts individuales no reportan fallas;
- no hay exposicion de `password` o `sessionToken` en exports;
- los usuarios sin permiso reciben `403`;
- los cruces QA_A/QA_B/DEFAULT quedan bloqueados.

NO-GO si:

- cualquier smoke devuelve `FAIL`;
- algun endpoint protegido responde `200` a usuario sin permiso;
- algun export contiene `password`, `sessionToken` o metadata sensible;
- QA_A/QA_B/DEFAULT presentan fuga cross-tenant;
- token viejo sigue aceptado despues de revocacion.

## Riesgos pendientes

- La cobertura depende de datos QA disponibles. Algunos casos secundarios pueden quedar `SKIP` si no se informan IDs opcionales.
- Los smokes son runtime HTTP; deben ejecutarse contra backend actualizado y dataset QA vigente.
- AUTH-Z no reemplaza pruebas unitarias ni revision de permisos futuros.

## Siguiente fase recomendada

- Incorporar `docs/qa/99-auth-z-final-security-smoke.sh` al checklist de merge/release.
- Ejecutarlo antes de declarar un release SaaS financiero completo.
- Mantener AUTH-F6 como smoke diario si se agregan endpoints tenant-aware nuevos.
