# LIVE-UX-FAST-1 - Header compacto LIVE

## Resumen ejecutivo

Se unifico el encabezado principal de `/live` en un solo header compacto, alineado con el estilo minimalista aplicado en `/reservations`. La tarjeta separada de `Ultima actualizacion` fue eliminada y su informacion paso a la metadata del header.

## Problema visual corregido

Antes, LIVE mostraba dos bloques superiores:

- header principal con `PANEL OPERATIVO`, `Operacion LIVE`, contexto de live y toggle de tema;
- tarjeta independiente con ultima actualizacion y boton `Actualizar`.

Ese patron ocupaba demasiado alto y generaba una lectura poco limpia para operacion.

## Qué cambió en el header

- `/live` usa el header compacto del `AppShell`.
- El titulo principal queda como `Operación LIVE`.
- La metadata queda en una sola linea compacta:

```text
En vivo #22 · QA Centro · Último apartado: #81 · Actualizado 08:23 p.m.
```

- Si no hay apartado reciente, se conserva el texto de sin apartados recientes.
- Si no hay live activo, se conserva el mensaje equivalente de sin transmision activa.

## Última actualización

`Última actualización` ya no se muestra en una tarjeta separada. Ahora se presenta como metadata del header:

```text
Actualizado 08:23 p.m.
```

Si no existe timestamp reciente, se muestra `Sin actualización reciente`.

## Actualizar

El boton `Actualizar` conserva la misma funcion:

- refresca datos manualmente;
- muestra loading con `Actualizando...`;
- no agrega polling automatico;
- no limpia estado operativo innecesario.

Visualmente queda como boton secundario compacto en el lado derecho del header.

## Oscuro

El toggle `Oscuro` conserva la logica global de tema. En desktop queda junto a `Actualizar`; en mobile se acomoda con el resto de acciones del header compacto.

## Responsive

Desktop:

- header horizontal;
- texto y metadata a la izquierda;
- `Oscuro` y `Actualizar` a la derecha;
- sin segunda tarjeta.

Mobile:

- header compacto con texto arriba y acciones debajo cuando no hay espacio;
- sin scroll horizontal;
- sin aumento innecesario de altura.

## Validaciones

Validaciones requeridas:

```bash
npm run lint
npx tsc --noEmit
git --no-pager diff --check
```

Backend test no aplica porque no se toca backend.

## Smoke visual recomendado

1. Abrir `/live`.
2. Confirmar que solo existe un header principal.
3. Confirmar que ya no aparece la tarjeta separada de ultima actualizacion.
4. Confirmar que la metadata incluye live, sucursal, ultimo apartado y actualizado.
5. Confirmar que `Oscuro` y `Actualizar` quedan juntos en desktop.
6. Presionar `Actualizar` y confirmar loading/refresh.
7. Cambiar modo oscuro y confirmar que el toggle conserva su funcion.
8. Validar en mobile que no hay scroll horizontal y el header no ocupa demasiado alto.
9. Confirmar que no se agrego polling automatico.
