# ERP - Validacion runtime tenant bootstrap

Fecha: 2026-05-13  
Fase: 2E - validacion runtime tenant  
Rama esperada: `feature/fase2e-validacion-runtime-tenant`  
Tipo: validacion y documentacion, sin migrar tablas P0

## Objetivo

Confirmar que el bootstrap tenant de Fase 2D funciona sin romper el ERP actual antes de migrar clientes, inventario, ventas, pagos, live o reportes.

## Alcance validado

- Flyway version `V38`.
- Company default.
- Relacion `branches.company_id`.
- Backend operativo.
- Dashboard operativo.
- Navegacion frontend operativa.
- Sucursales visibles y operativas.
- Compatibilidad del RC previo.
- Revision de `TenantResolver`, `CurrentTenantContext`, `TenantController` y `BranchService`.

## Fuera de alcance

- No se migraron `customers`.
- No se migraron `items`.
- No se migraron `sales`.
- No se migraron `payments`.
- No se migraron `reports`.
- No se migro `live`.
- No se implemento `user_companies`.
- No se implemento consola SaaS HPSQ-SOFT.

## Validaciones manuales reportadas

Validacion reportada por usuario en ambiente local/QA:

| Validacion | Resultado |
|---|---|
| Flyway quedo en `V38` | OK |
| Existe company default `DEFAULT` | OK |
| Nombre company default `HPSQ-SOFT Default Company` | OK |
| Todas las sucursales actuales tienen `company_id = 1` | OK |
| Backend sigue funcionando | OK |
| Dashboard sigue funcionando | OK |
| Navegacion frontend sigue funcionando | OK |
| Sucursales siguen visibles y operativas | OK |
| RC previo no se rompio | OK |

## Queries SQL utilizadas o recomendadas

Estas queries corresponden a la validacion de bootstrap tenant:

```sql
SELECT version, success
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 5;
```

Resultado esperado:

- Version `38` aplicada correctamente.

```sql
SELECT id, code, name, status
FROM companies
WHERE code = 'DEFAULT';
```

Resultado esperado:

- `code = DEFAULT`
- `name = HPSQ-SOFT Default Company`
- `status = ACTIVE`

```sql
SELECT COUNT(*) AS branches_without_company
FROM branches
WHERE company_id IS NULL;
```

Resultado esperado:

- `branches_without_company = 0`

```sql
SELECT b.id, b.code, b.name, b.company_id, c.code AS company_code
FROM branches b
JOIN companies c ON c.id = b.company_id
ORDER BY b.id;
```

Resultado esperado:

- Todas las sucursales actuales apuntan a company default.

## Endpoints probados

### Evidencia manual reportada

| Endpoint/flujo | Resultado |
|---|---|
| Login | OK |
| Dashboard | OK |
| Sucursales | OK |
| Navegacion frontend | OK |

### Evidencia tecnica intentada por Codex

Comandos HTTP intentados contra `http://localhost:8090`:

| Prueba | Resultado observado | Interpretacion |
|---|---|---|
| `GET /api/health` | `401 Unauthorized` | El runtime que respondio no parece estar sincronizado con la rama/codigo actual donde health esta excluido del token filter. |
| `GET /api/tenant/current` sin token | `401 Unauthorized` | Esperado: endpoint tenant requiere usuario autenticado. |
| `POST /api/auth/login` con `qa.admin@local.test` | `500 Internal Server Error` | No se corrigio en esta fase; revisar runtime/logs antes de cerrar validacion HTTP. |
| `GET /api/tenant/current` con token | No se completo por fallo de login runtime. | Pendiente tras reiniciar/desplegar backend con rama actual. |

Log backend observado:

```text
NoResourceFoundException: No static resource api/tenant/current for request '/api/tenant/current'
API GET /api/tenant/current -> 500
```

Interpretacion:

- El codigo actual contiene `TenantController` con `GET /api/tenant/current`.
- Las pruebas Maven cargan el contexto Spring correctamente.
- El runtime en `8090` que respondio durante esta validacion parece no estar desplegado/reiniciado con la version actual de la rama 2E, o existe un proceso distinto atendiendo el puerto.

## Revision tecnica de codigo

### `TenantResolver`

Ubicacion:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/tenant/TenantResolver.java`

Comportamiento validado:

- Resuelve usuario autenticado desde `CurrentUser`.
- Une `users -> branches -> companies`.
- Exige usuario activo.
- Exige sucursal activa.
- Exige company activa.
- Devuelve `CurrentTenantContext`.
- Bloquea branch que no pertenece a company en `assertBranchBelongsToCompany`.

Riesgo:

- Aun no se integra automaticamente a todos los endpoints P0.
- Aun no existe `user_companies`.
- Aun no se guarda company activa en sesion.

### `CurrentTenantContext`

Ubicacion:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/tenant/CurrentTenantContext.java`

Campos actuales:

- `companyId`
- `companyCode`
- `companyName`
- `branchId`
- `branchCode`
- `branchName`
- `userId`

Riesgo:

- Es suficiente para bootstrap, pero todavia no incluye permisos, plan, timezone, soporte HPSQ-SOFT ni correlationId.

### `BranchService`

Ubicacion:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/branch/BranchService.java`

Comportamiento validado:

- Al crear sucursal sin company explicita, asigna company default.
- Al crear o actualizar valida unicidad por company y codigo.
- Mantiene compatibilidad con flujos existentes que no envian `company`.

Riesgo:

- `findAll()` y `findByStatus()` siguen siendo globales temporalmente. Es aceptable solo mientras exista una unica company default.

## Pruebas automatizadas

Comando ejecutado:

```powershell
.\mvnw.cmd test
```

Resultado:

- `BUILD SUCCESS`
- `Tests run: 8`
- `Failures: 0`
- `Errors: 0`
- `Skipped: 0`

Cobertura relevante:

- `CompanyServiceTests`
- `TenantResolverTests`
- `HealthControllerSecurityTests`
- `ControlRopaApplicationTests`

Observacion:

- Maven valida 38 migraciones y el contexto Spring carga correctamente.
- La validacion HTTP runtime queda pendiente de reiniciar/desplegar el backend con la rama actual.

## Riesgos validados

| Riesgo | Estado | Comentario |
|---|---|---|
| Fallback tenant default | Aceptado temporalmente | Necesario para compatibilidad mono-company. Debe retirarse o acotarse al avanzar a multi-company real. |
| Branch sin company | Mitigado por migracion | `branches.company_id` queda `NOT NULL` despues del backfill. |
| Company inactiva | Mitigado parcialmente | `TenantResolver` y `CompanyService` rechazan company no activa. Falta integrarlo a todos los endpoints P0. |
| Company null | Mitigado para branches | FK y `NOT NULL` en branches. Pendiente para tablas P0 futuras. |
| Request sin tenant | Parcial | `/api/tenant/current` requiere token. Otros endpoints aun no usan tenant context. |
| Impacto futuro sobre sesiones | Pendiente | `user_api_sessions` aun no tiene company/branch activa. |
| Runtime desincronizado | Abierto | El proceso en `8090` no expuso `/api/tenant/current` durante validacion Codex. |

## Compatibilidad backward

Estado: compatible con RC actual segun validacion manual reportada.

Motivos:

- Se mantiene company default unica.
- Las sucursales existentes fueron asignadas a company default.
- No se tocaron ventas, pagos, live, reportes ni inventario.
- `BranchService` cubre altas existentes sin `company`.

## Validaciones pendientes

Antes de migrar tablas P0:

1. Reiniciar/desplegar backend QA con rama actual.
2. Validar `GET /api/tenant/current` con token real.
3. Confirmar que `/api/health` responde `200 OK` en el mismo proceso desplegado.
4. Repetir login QA con `qa.admin@local.test`.
5. Repetir dashboard y sucursales despues del reinicio.
6. Documentar evidencia JSON de `/api/tenant/current`.
7. No avanzar a `customers/items/sales/payments/reports` hasta cerrar esta evidencia runtime.

## Decision QA

Decision: `GO condicionado para bootstrap`, `NO-GO para migrar tablas P0`.

La base tenant minima esta implementada y las pruebas automatizadas pasan, pero falta cerrar evidencia HTTP runtime del endpoint `/api/tenant/current` sobre un backend reiniciado/desplegado con la rama actual.
