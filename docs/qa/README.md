# Paquete QA - Jornada operativa

Este paquete prepara una prueba completa de un dia operativo usando datos aislados con prefijo `QA_`. La idea es que el tecnico pueda ejecutar siempre el mismo escenario y llegar al mismo resultado esperado.

## Orden de uso

1. Hacer respaldo de la base actual.
2. Ejecutar `02-limpieza-datos-qa.sql` si ya hubo pruebas anteriores.
3. Ejecutar `01-preparación-datos-qa.sql`.
4. Realizar la prueba con `jornada-operativa-checklist.md`.
5. Registrar hallazgos con `plantilla-incidencias.md`.
6. Comparar el cierre contra `resultados-esperados.md`.
7. Opcional: ejecutar `02-limpieza-datos-qa.sql` al finalizar.

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

## Datos base

Sucursales:

| Sucursal | Código |
| --- | --- |
| QA Centro | QA_CTR |
| QA Veracruz | QA_VER |

Clientes existentes:

| Cliente | Sucursal |
| --- | --- |
| QA Cliente Existente Centro Ana | QA Centro |
| QA Cliente Existente Centro Bruno | QA Centro |
| QA Cliente Existente Veracruz Carla | QA Veracruz |

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
