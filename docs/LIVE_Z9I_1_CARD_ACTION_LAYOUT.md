# LIVE-Z9I.1 - Ajuste responsive de acciones en tarjetas LIVE

Fecha: 2026-06-07
Rama: `feature/live-z9i-1-card-action-layout`

## Objetivo

LIVE-Z9I.1 ajusta el layout de acciones en tarjetas LIVE para que los botones se muestren en la misma linea cuando hay espacio suficiente y se apilen en mobile.

No se modifican backend, endpoints, AUTH/RBAC, permisos, filtros de disponibilidad ni reglas operativas LIVE.

## Problema visual detectado

En desktop/tablet, la tarjeta `Prenda preparada para cambio` mostraba acciones apiladas aunque habia espacio horizontal:

- `Poner esta prenda al aire`;
- `Quitar prenda preparada`.

Esto hacia que la tarjeta creciera de alto y se viera menos profesional.

## Tarjetas revisadas

- `Prenda preparada para cambio`.
- `Prenda al aire ahora`.

Ambas viven en `app/live.tsx` dentro del render de tarjetas operativas LIVE.

## Ajuste aplicado

Se agrega un layout especifico para acciones de tarjetas de prenda:

- tablet/desktop: acciones en fila;
- phone/mobile: acciones en columna;
- gap consistente;
- columnas flexibles;
- altura de botones consistente por reutilizar `AppButton`;
- helper text debajo de la fila cuando aplica.

## Comportamiento desktop/tablet

`Prenda preparada para cambio`:

```text
[PONER ESTA PRENDA AL AIRE] [QUITAR PRENDA PREPARADA]
```

`Prenda al aire ahora`:

```text
[RETIRAR PRENDA DEL AIRE] [CAMBIAR POR PRENDA PREPARADA]
```

## Comportamiento mobile

En mobile las acciones se apilan:

```text
[PONER ESTA PRENDA AL AIRE]
[QUITAR PRENDA PREPARADA]
```

Esto mantiene el area tactil clara y evita botones comprimidos.

## Sin cambios funcionales

No se cambio:

- poner prenda al aire;
- quitar prenda preparada;
- cambiar por prenda preparada;
- retirar prenda del aire;
- filtros de disponibilidad LIVE-Z9I;
- selector de prendas;
- permisos;
- i18n;
- light/dark;
- presets visuales.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/live`.
3. Preparar una prenda.
4. Confirmar que en desktop/tablet los botones de `Prenda preparada para cambio` aparecen en una sola linea.
5. Reducir ancho o abrir mobile.
6. Confirmar que esos botones se apilan correctamente.
7. Revisar `Prenda al aire ahora` con acciones disponibles.
8. Confirmar fila en desktop/tablet y columna en mobile.
9. Validar light/dark.

## GO/NO-GO

GO tecnico si pasan lint, TypeScript, export web, Maven test/package y `git diff --check`.

GO visual pendiente de corrida manual responsive.
