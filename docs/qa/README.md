# Paquete QA - Jornada operativa

Este paquete prepara una prueba completa de un dia operativo usando datos aislados con prefijo `QA_`. La idea es que el tecnico pueda ejecutar siempre el mismo escenario y llegar al mismo resultado esperado.

## Orden de uso

1. Hacer respaldo de la base actual.
2. Ejecutar `02-limpieza-datos-qa.sql` si ya hubo pruebas anteriores.
3. Ejecutar `01-preparacion-datos-qa.sql`.
4. Realizar la prueba con `jornada-operativa-checklist.md`.
5. Registrar hallazgos con `plantilla-incidencias.md`.
6. Comparar el cierre contra `resultados-esperados.md`.
7. Opcional: ejecutar `02-limpieza-datos-qa.sql` al finalizar.

## Orden adicional para tenant-aware

Despues de aplicar migraciones hasta `V39`, ejecutar tambien:

```text
06-usuarios-tenant-qa.sql
```

Este script es solo QA y asegura que `qa.reportes@local.test`, `qa.sinpermisos@local.test` y `qa.soporte@local.test` existan, tengan company `DEFAULT`, sucursal `QA_CTR`, registros en `user_companies` y sesiones legacy revocadas para forzar login tenant-aware.

Despues de aplicar migraciones hasta `V43` y validar customers/items/batches tenant-aware, ejecutar tambien:

```text
07-empresa-ab-tenant-qa.sql
```

Este script es solo QA y prepara Empresas A/B para validar aislamiento real:

- Companies `QA_A` y `QA_B`.
- Branches `QA_A_CTR` y `QA_B_CTR`.
- Usuarios `qa.a.admin@local.test`, `qa.b.admin@local.test`, `qa.a.vendedor@local.test` y `qa.b.vendedor@local.test`.
- Customers/items/batches duplicados por company para probar que una empresa no ve datos de otra.

No borra datos historicos, no toca `DEFAULT` y solo revoca sesiones/locks de esos usuarios QA A/B.

Para corregir o normalizar permisos/sesion tenant-aware de usuarios QA usados en LIVE, ejecutar:

```text
08-live-qa-permissions-fix.sql
```

Este script es solo QA y asegura `user_companies`, `user_branches`, permisos minimos de LIVE, canal `LIVE` activo en sucursal y revocacion de sesiones activas para forzar un login limpio. No trunca tablas, no borra historicos y no crea migraciones Flyway.

## Usuarios QA

Todos usan la misma clave:

```text
Qa12345!
```

| Rol | Usuario |
| --- | --- |
| Administrador | qa.admin@local.test |
| Supervisor Centro | qa.supervisor.centro@local.test |
| Vendedor Centro | qa.vendedor.centro@local.test |
| Caja Centro | qa.caja.centro@local.test |
| Inventario Centro | qa.inventario.centro@local.test |
| Empaque Centro | qa.empaque.centro@local.test |
| Logistica Centro | qa.logistica.centro@local.test |
| Mensajero Centro | qa.mensajero.centro@local.test |
| Vendedor Veracruz | qa.vendedor.veracruz@local.test |
| Caja Veracruz | qa.caja.veracruz@local.test |
| Empresa A Admin | qa.a.admin@local.test |
| Empresa B Admin | qa.b.admin@local.test |
| Empresa A Vendedor | qa.a.vendedor@local.test |
| Empresa B Vendedor | qa.b.vendedor@local.test |

## Datos base

Sucursales:

| Sucursal | Codigo |
| --- | --- |
| QA Centro | QA_CTR |
| QA Veracruz | QA_VER |
| QA Empresa A Centro | QA_A_CTR |
| QA Empresa B Centro | QA_B_CTR |

Clientes existentes:

| Cliente | Sucursal |
| --- | --- |
| QA Cliente Existente Centro Ana | QA Centro |
| QA Cliente Existente Centro Bruno | QA Centro |
| QA Cliente Existente Veracruz Carla | QA Veracruz |
| Cliente Duplicado QA | QA Empresa A Centro |
| Cliente Duplicado QA | QA Empresa B Centro |

Metodos de pago:

| Metodo | Uso |
| --- | --- |
| QA Efectivo | Pagos de mostrador y caja |
| QA Tarjeta | Pagos con referencia bancaria |
| QA Transferencia | Depositos y pagos referenciados |

## Reglas de evidencia

Cada caso debe guardar:

- Usuario usado.
- Sucursal activa.
- Folio, id o referencia generada.
- Captura en movil si el caso valida responsivo.
- Resultado: `Paso`, `Fallo`, `Bloqueado` o `No aplica`.

Si un caso falla, no corregir datos manualmente sin registrarlo como incidencia.
