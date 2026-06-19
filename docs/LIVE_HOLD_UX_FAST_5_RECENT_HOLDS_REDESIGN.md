# LIVE-HOLD-UX-FAST-5 - Rediseño de apartados recientes en LIVE

## Resumen ejecutivo

Se rediseñó la sección **Apartados recientes** de LIVE para que cada apartado se vea como una sola fila/card operativa. El contenido y las acciones quedaron dentro del mismo contenedor, con una estructura consistente para cliente formal e interesado/alias.

La fase fue exclusivamente frontend. No se tocó backend, base de datos, migraciones, Android/EAS, login, AUTH ni `/reservations`.

## Problema visual corregido

La versión anterior todavía mostraba una mini-card interna de datos con acciones fuera del bloque. Eso generaba una lectura poco profesional:

- datos cargados a la izquierda;
- espacio vacío a la derecha;
- interesado con apariencia de alerta;
- demasiadas etiquetas visuales;
- `Vincular cliente` deshabilitado como acción principal;
- `FINALIZAR EN VIVO` aislado debajo con espacio muerto.

## Mini-card interna eliminada

El apartado reciente ahora es un solo contenedor:

- borde suave;
- acento lateral sutil para interesados;
- contenido y acciones en la misma fila/card;
- sin tarjeta interna adicional para los datos.

## Distribución de información

En desktop se distribuye en zonas:

- identidad: `Apartado LIVE · En vivo #...` y `Cliente/Interesado · nombre`;
- operación: pendiente o venta LIVE guardada, prenda y sucursal;
- resultado: estado de pago, monto y acciones compactas.

En mobile se conserva una columna compacta, sin scroll horizontal.

## Interesado

El interesado queda visible sin estilo de alerta:

- `Interesado · alias`;
- alias con mayor peso visual;
- `Pendiente: vincular cliente` como texto secundario;
- acento lateral discreto;
- sin fondo amarillo/café ni badges grandes.

## Cliente formal

Cliente formal usa la misma estructura visual:

- `Cliente · nombre`;
- prenda y sucursal como metadata;
- pago y monto en la zona de resultado;
- acciones compactas.

## Regla de Vincular cliente

Como la vinculación de alias a cliente formal todavía no está implementada funcionalmente:

- no aparece como botón principal deshabilitado;
- `Detalle` queda como acción principal visible;
- `Vincular cliente` permanece dentro de `Más acciones` como acción deshabilitada;
- la explicación indica que estará disponible en una siguiente fase.

No se crean clientes falsos automáticamente.

## Finalizar en vivo

`Finalizar en vivo` quedó dentro de un footer compacto del panel LIVE:

- alineado a la derecha en desktop;
- con ayuda a la izquierda;
- botón peligroso sobrio;
- en mobile mantiene ancho cómodo sin convertirse en barra gigante.

La lógica y confirmación existentes no cambiaron.

## Venta inmediata LIVE

`Venta inmediata LIVE` sigue dentro de `Más acciones` y no se muestra como acción principal.

Se confirmó que en `app` y `locales` no queda el texto visible `Cerrar como venta LIVE`.

## Validaciones

Validaciones requeridas:

- `npm run lint`
- `npx tsc --noEmit`
- `git --no-pager diff --check`

## Smoke visual recomendado

1. Abrir LIVE.
2. Revisar `Apartados recientes`.
3. Confirmar que no existe mini-card interna con botones afuera.
4. Confirmar que cada apartado es una sola fila/card.
5. Confirmar que interesado no parece alerta.
6. Confirmar que cliente formal e interesado comparten estructura.
7. Confirmar que `Vincular cliente` no aparece como botón principal deshabilitado.
8. Confirmar que `Vincular cliente` aparece en `Más acciones` deshabilitado.
9. Confirmar que `Venta inmediata LIVE` está dentro de `Más acciones`.
10. Confirmar que no aparece `Cerrar como venta LIVE`.
11. Confirmar que `Finalizar en vivo` no queda aislado con espacio muerto.
12. Confirmar que en mobile no hay scroll horizontal.
13. Confirmar que no se agregó polling automático.

## Riesgos

- La proporción final debe validarse visualmente con datos reales de cliente formal e interesado.
- La vinculación real de alias a cliente formal sigue pendiente para una fase posterior.

## Siguiente fase recomendada

Implementar el flujo real de vincular alias/interesado a cliente formal y, después, hacer smoke visual con rol vendedor y admin en LIVE.
