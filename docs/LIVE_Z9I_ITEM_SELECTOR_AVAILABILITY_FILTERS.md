# LIVE-Z9I - Filtros de disponibilidad en selector de prendas

Fecha: 2026-06-07
Rama: `feature/live-z9i-item-selector-availability-filters`

## Objetivo

LIVE-Z9I agrega filtros claros de disponibilidad en el selector `Buscar prenda` de `/live`, para que el operador encuentre rapido prendas que si puede poner al aire o preparar para cambio.

No se modifican backend, endpoints, AUTH/RBAC, pagos, caja ni reglas profundas LIVE.

## Problema reportado por QA

El selector de prendas podia mostrar en la misma lista:

- prendas disponibles;
- prendas apartadas o reservadas;
- prendas vendidas;
- prendas con disponibilidad no confirmada.

Esto confundia durante la operacion LIVE porque el operador necesitaba enfocarse primero en prendas disponibles.

## Auditoria

El selector de prendas esta implementado dentro de `app/live.tsx` con `AppBottomModal`, `AppInput`, `FlatList` y `AppOptionRow`.

La disponibilidad operativa ya se resolvia con `getItemLiveAvailability`, que bloquea seleccion y puesta al aire cuando la prenda no es valida. LIVE-Z9I reutiliza esa regla para filtrar visualmente sin cambiar contratos de API.

## Filtros agregados

El selector muestra chips con contador:

- `Disponibles`;
- `Apartadas`;
- `Vendidas / no disponibles`;
- `Todas`.

El filtro por defecto al abrir el selector es `Disponibles`.

## Comportamiento de busqueda

La busqueda existente se conserva:

- codigo;
- QR;
- tipo;
- marca;
- talla.

Los filtros de disponibilidad se aplican despues de la busqueda. Los contadores se calculan sobre los resultados de la busqueda actual.

## Reglas de disponibilidad

- `AVAILABLE` y estados operables segun `getItemLiveAvailability`: disponibles.
- `RESERVED`: apartadas.
- `SOLD`, disponibilidad no confirmada u otros estados no operables: vendidas / no disponibles.
- `DISABLED` sigue excluido desde la carga existente.

Si se cambia a `Todas`, las prendas no disponibles se muestran con su motivo, pero la seleccion sigue bloqueada por la validacion existente.

## Estados visuales

- Disponible: color `success`.
- Apartada: color `warning`.
- Vendida: color `danger`.
- No disponible / no confirmada: color `warning` o bloqueo segun motivo.

No se agregan colores hardcodeados; se usan tokens del tema.

## I18N

Se agregan claves `live.*` en:

- `es`;
- `en`;
- `pt-BR`;
- `fr`;
- `ja`;
- `zh`;
- `ko`.

Textos nuevos:

- filtros de disponibilidad;
- mostrar/ocultar no disponibles;
- ayuda del filtro;
- empty state por filtro;
- empty state por busqueda.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/live`.
3. Abrir `Buscar prenda`.
4. Confirmar que el filtro por defecto es `Disponibles`.
5. Confirmar que vendidas/reservadas no aparecen por defecto.
6. Cambiar a `Todas`.
7. Confirmar que vendidas/reservadas aparecen con motivo.
8. Buscar por codigo, tipo, marca o talla.
9. Confirmar que los filtros siguen aplicando.
10. Intentar seleccionar vendida/no disponible.
11. Confirmar que no permite operacion o muestra bloqueo claro.
12. Validar light/dark y mobile/tablet.

## Limitaciones

- No se crea endpoint nuevo.
- No se implementa filtro backend.
- La disponibilidad depende de los datos ya cargados en frontend.
- La validacion final sigue siendo la regla operativa existente al seleccionar o poner al aire.

## GO/NO-GO

GO tecnico si pasan lint, TypeScript, export web, Maven test/package y `git diff --check`.

GO visual pendiente de corrida manual con inventario que contenga prendas disponibles, apartadas y vendidas.
