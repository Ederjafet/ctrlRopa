# PRODUCT-C2 - Editor controlado de identidad visual

## Objetivo

PRODUCT-C2 agrega una capa controlada para ajustar la identidad visual principal del cliente sin tocar codigo y sin persistencia backend. El editor vive en `/ui-kit` y trabaja sobre tokens semanticos, no sobre componentes individuales.

## Alcance

Incluido:

- seleccion de plantilla visual base;
- edicion local de tokens principales;
- preview en vivo de botones, cards, badges, inputs y estado reservado;
- persistencia local de overrides;
- restauracion a plantilla base;
- convivencia con tema claro/oscuro.

No incluido:

- persistencia por cliente/tenant;
- endpoints;
- migraciones;
- editor libre por componente;
- edicion libre de colores de texto;
- cambios de AUTH/RBAC, pagos, caja, billing, reportes backend, IA o reglas LIVE.

## Tokens editables

El editor permite ajustar solo tokens semanticos principales:

- color primario;
- color secundario;
- color acento;
- color exito;
- color advertencia;
- color peligro / reservado;
- color de fondo;
- color de superficie/cards;
- radio visual;
- densidad visual.

Los tokens se aplican sobre la plantilla activa y se resuelven asi:

```text
preset base + overrides locales + light/dark mode = tokens finales
```

## Donde se cambia

Ruta:

```text
/ui-kit
```

Seccion:

```text
Identidad visual -> Editor controlado
```

Acciones disponibles:

- Aplicar cambios localmente;
- Restaurar plantilla.

## Persistencia local

La personalizacion se guarda en almacenamiento local del frontend mediante `AsyncStorage`.

Claves usadas:

- `controlRopa.localVisualPreset`
- `controlRopa.localVisualIdentityOverrides`

Esta decision evita simular branding real por tenant mientras no exista soporte backend.

## Validacion

Validaciones actuales:

- solo acepta colores hexadecimales `#RRGGBB`;
- bloquea aplicar si hay colores invalidos;
- muestra advertencias simples de contraste para fondo/superficie;
- no permite editar texto libremente para reducir riesgo de ilegibilidad.

Pendiente:

- algoritmo completo de contraste WCAG;
- validacion centralizada por preset antes de permitir persistencia tenant;
- vista de auditoria de cambios visuales.

## Relacion con prenda reservada

El estado reservado usa tokens `danger` y `dangerSoft`.

Si el usuario cambia el token "color peligro / reservado":

- cambia la card reservada;
- cambia el chip Reservada;
- cambia la semantica visual danger asociada.

No cambia la logica de reserva ni reglas LIVE.

## Light / Dark

El editor trabaja sobre el modo visual activo. Para ajustar ambos modos, el usuario debe alternar claro/oscuro y aplicar los cambios deseados en cada modo.

Esto mantiene el control de contraste por modo y evita forzar un mismo color en contextos visuales incompatibles.

## Recomendaciones para clientes

- Usar presets como base, no partir de colores aleatorios.
- Editar primero primario/acento.
- Reservar danger para estados operativos delicados.
- Validar `/live`, `/customers`, `/reservations`, `/users`, `/system` y `/reports` despues de aplicar.
- Validar siempre en claro y oscuro.

## Futuro backend / tenant

Fase futura sugerida:

- guardar preset y overrides por tenant;
- restringir presets permitidos por cliente;
- agregar auditoria de cambios;
- validar contraste antes de persistir;
- permitir rollback a identidad aprobada.

## GO/NO-GO

GO para uso local/desarrollo/admin. NO-GO para prometer branding persistente por cliente hasta implementar backend/tenant.
