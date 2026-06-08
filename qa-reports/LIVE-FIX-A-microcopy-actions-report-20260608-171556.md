# LIVE-FIX-A - Complemento de microcopy de acciones LIVE

## Contexto QA

QA detecto microcopy confuso despues de cerrar un apartado como venta LIVE:

- `Volver a apartado` no explicaba que deshacia el cierre operativo de venta LIVE.
- Junto a `Cancelar apartado`, podia parecer una accion similar o ambigua.

## Alcance ejecutado

- Se agrego accion especifica `Deshacer cierre de venta LIVE` solo para registros en estado `OPERATIONAL_SOLD`.
- Se mantuvo `Cancelar apartado` como accion separada.
- Se ajustaron helpers:
  - `Cerrar como venta LIVE`: venta operativa dentro del LIVE, sin pago ni caja.
  - `Deshacer cierre de venta LIVE`: regresa a seguimiento como apartado, sin pago ni caja.
  - `Cancelar apartado`: cancela el apartado de la prenda, sin pago ni caja.
- Se actualizaron textos en ES, EN, PT-BR, FR, JA, ZH y KO.
- Se actualizaron documentos QA y matriz PRODUCT-D4 REAL.

## Fuera de alcance

- No se modifico backend.
- No se cambiaron estados funcionales.
- No se tocaron pagos ni caja.
- No se cambiaron permisos.
- No se toco cambio de precio.

## Validaciones ejecutadas

- `npm.cmd run lint`: PASS con 53 warnings preexistentes del repositorio y 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS.

No se ejecuto Maven porque el complemento no modifica backend, configuracion, contratos ni reglas funcionales.

## Estado QA

- Estado tecnico: implementado.
- Estado QA: PENDING_QA.
