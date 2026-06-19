# OP-UX-FAST-2 - Rediseño visual de pantallas operativas

## Resumen ejecutivo

Se rediseñó el contenido operativo de `Paquetes`, `Venta puerta`, `Apartado puerta` y `Envíos` para acercarlas al patrón visual ya trabajado en LIVE y `/reservations`: headers compactos, filas/cards operativas, acciones pequeñas, `Detalle` / `Más`, empty states claros y menos botones gigantes.

No se tocó backend, base de datos, migraciones, Android/EAS, AUTH, LIVE ni `/reservations`. Tampoco se agregó polling automático.

## Diagnóstico visual de Paquetes

`/customer-packages` ya tenía header compacto, pero cuando no había cliente seleccionado seguía funcionando visualmente como selector plano de clientes. El backend actual expone paquetes por cliente, no una bandeja global por sucursal.

## Diagnóstico visual de Venta puerta

`/door-sale` conservaba bloques altos con botones de ancho completo para seleccionar cliente, agregar prenda, buscar, escanear y registrar venta. El flujo era funcional, pero visualmente no parecía una pantalla operativa compacta.

## Diagnóstico visual de Apartado puerta

`/door-reservation` tenía el mismo problema que venta puerta: secciones altas, botones grandes y prendas agregadas como bloques largos. El flujo de cliente real, prendas, anticipo y método de pago se mantuvo intacto.

## Diagnóstico visual de Envíos

`/shipments` ya estaba más cercano al patrón operativo. Se ajustó copy visible, empty state y rótulos para usar `Envíos`, `Guía`, `Más` y filas compactas consistentes.

## Cambios en Paquetes

- La lista de clientes se convirtió en filas/cards compactas.
- Cada fila muestra `Cliente · Nombre`, teléfono y contexto de paquetes por cliente.
- La acción principal queda como `Ver paquetes`.
- La acción secundaria `Más` abre un modal con acciones reales o pendientes.
- La limitación de read-model global por sucursal quedó explícita en UI y documentación.

## Cambios en Venta puerta

- La sección de cliente se compactó en una fila con acciones a la derecha.
- La captura de prenda usa input + `Agregar` en una sola línea cuando hay espacio.
- `Buscar`, `Escanear` y `Alta rápida` quedan como acciones secundarias compactas.
- La venta actual muestra prendas como filas operativas con precio y `Quitar`.
- El pago se muestra como resumen con método y total.
- El cierre de venta queda en una barra final sobria, no como botón gigante suelto.

## Cambios en Apartado puerta

- La sección de cliente real se compactó con acción `Seleccionar/Cambiar`.
- La captura de prenda usa el mismo patrón compacto de venta puerta.
- Las prendas apartadas se muestran como filas operativas.
- El anticipo se muestra como resumen con saldo pendiente.
- El método de pago aparece solo cuando el anticipo es mayor a cero.
- El botón de crear apartado queda acotado al footer operativo.

## Cambios en Envíos

- Se corrigieron textos visibles: `Envíos`, `Envío`, `Guía`, `Más`.
- El empty state ahora orienta al operador: los paquetes listos aparecerán ahí.
- Se mantuvieron KPIs, filas compactas, detalle y menú de acciones.

## Mejoras sin backend

- Rediseño visual profundo de contenido.
- Acciones más compactas y jerarquizadas.
- Empty states más claros.
- Copy operativo consistente.
- No se agregaron endpoints ni migraciones.

## Limitaciones por backend

- `Paquetes` sigue dependiendo del read-model por cliente.
- Queda pendiente una bandeja global de paquetes por sucursal.
- Algunas acciones de paquete/envío siguen centralizadas en las pantallas de detalle o quedan deshabilitadas con explicación.

## Acciones funcionales

- `Ver paquetes` por cliente.
- `Detalle` de paquete/envío.
- `Más` con acciones secundarias.
- Selección de cliente en venta/apartado puerta.
- Agregar prenda por código, búsqueda o escaneo.
- Registrar venta puerta y crear apartado puerta con la lógica existente.
- Crear envío con la lógica existente.

## Acciones pendientes

- Bandeja global de paquetes.
- Gestión completa de pagos de paquete desde listado.
- Flujo completo de liberar envío desde paquete pagado.
- Acciones avanzadas de envío fuera del detalle.

## Validaciones

Ejecutar:

```bash
npm run lint
npx tsc --noEmit
git --no-pager diff --check
```

Backend test no aplica mientras no se toque backend.

## Smoke QA recomendado

1. Abrir `/customer-packages` y validar filas compactas de cliente, `Ver paquetes` y `Más`.
2. Abrir un cliente en paquetes y validar filas de paquete con `Detalle` / `Más`.
3. Abrir `/door-sale` y confirmar que cliente, agregar prenda, venta actual y pago ya no usan botones gigantes.
4. Abrir `/door-reservation` y confirmar el mismo patrón compacto.
5. Abrir `/shipments` y validar header, KPIs, empty state o filas compactas.
6. Revisar mobile: sin scroll horizontal y con botones tocables.
7. Confirmar que no hay polling automático.

## Siguiente fase recomendada

Crear read-model global de paquetes por sucursal y evolucionar `Paquetes` a una bandeja real con filtros por estado, cliente, saldo, envío y siguiente acción.
