# LIVE-HOLD-UX-FAST-4 - Apartados recientes balanceados en LIVE

## Resumen ejecutivo

Se refinó la sección **Apartados recientes** de LIVE para que funcione como una lista operativa más compacta y balanceada. La información dejó de quedar cargada hacia la izquierda, el monto y estado de pago tienen un bloque propio, y las acciones visibles se redujeron a botones más pequeños.

No se tocó backend, base de datos, migraciones, Android/EAS, login, AUTH ni `/reservations`.

## Problema visual corregido

La versión anterior mantenía demasiado peso visual en cada apartado reciente:

- El interesado se veía como alerta pesada.
- Los botones `Vincular cliente`, `Ver detalle` y `Más acciones` ocupaban demasiado espacio.
- En desktop quedaba mucho vacío a la derecha.
- `FINALIZAR EN VIVO` robaba protagonismo por tamaño.

## Redistribución de la card

Cada apartado reciente ahora queda organizado en zonas más claras:

- Izquierda: contexto LIVE, cliente/interesado y pendiente de seguimiento.
- Centro: prenda y sucursal/canal como metadata compacta.
- Derecha: estado de pago, monto y acciones compactas.

En desktop la fila usa mejor el ancho disponible. En mobile se mantiene una columna sin scroll horizontal.

## Interesado

El interesado sigue destacando, pero con estilo más sobrio:

- Fondo sutil de superficie.
- Borde neutro.
- Alias en texto fuerte.
- `Pendiente: vincular cliente` como texto secundario.

Se evita el patrón de alerta amarilla/café pesada.

## Cliente formal

El cliente formal conserva una lectura limpia:

- Badge `CLIENTE`.
- Nombre en primer nivel visual.
- Prenda/sucursal como metadata breve.
- Monto y pago separados a la derecha en desktop.

## Botones compactos

Las acciones visibles ahora usan textos cortos:

- `Vincular cliente`
- `Detalle`
- `Más`

`Más` abre el menú de acciones secundarias. `Venta inmediata LIVE` permanece dentro de ese menú y no se muestra como acción principal.

## Finalizar en vivo

`FINALIZAR EN VIVO` conserva su lógica y confirmación, pero ahora se presenta como acción peligrosa compacta:

- Tamaño controlado en desktop.
- Alineación a la derecha.
- Ayuda alineada con la acción.
- En mobile puede ocupar el ancho disponible, pero con menor altura.

## Confirmaciones de alcance

- No se agregó polling automático.
- No se cambió la lógica de refresco manual.
- No se cambió la lógica de venta inmediata LIVE.
- No queda texto visible `Cerrar como venta LIVE`.
- No se tocó backend.

## Validaciones

Validaciones requeridas para la fase:

- `npm run lint`
- `npx tsc --noEmit`
- `git --no-pager diff --check`

## Smoke visual recomendado

1. Abrir LIVE.
2. Revisar `Apartados recientes`.
3. Confirmar que la información se distribuye mejor en desktop.
4. Confirmar que interesado se ve destacado pero no como alerta pesada.
5. Confirmar que `Detalle` y `Más` son compactos.
6. Confirmar que `Venta inmediata LIVE` está en `Más acciones`.
7. Confirmar que no aparece `Cerrar como venta LIVE`.
8. Confirmar que `FINALIZAR EN VIVO` ya no es una barra roja gigante.
9. Confirmar que en mobile no hay scroll horizontal.
10. Confirmar que no hay polling automático.

## Riesgos

- La validación visual final requiere navegador/dispositivo para confirmar proporciones exactas.
- La acción `Vincular cliente` sigue pendiente de implementación funcional completa y se conserva deshabilitada.

## Siguiente fase recomendada

Ejecutar smoke visual en desktop y mobile sobre LIVE, con apartados recientes tanto de cliente formal como de interesado/alias.
