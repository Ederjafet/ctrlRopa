# PRODUCT-C - Premium Visual System

Fecha: 2026-06-04

## Objetivo

Definir y aplicar una direccion visual premium global para `control-ropa-app`, sin tocar backend ni reglas de negocio.

## Direccion visual elegida

La identidad visual elegida es:

**Enterprise retail premium**

Principios:

- Panel operativo moderno, no formulario administrativo.
- Retail profesional: claro, confiable, rapido de leer y apto para tablet.
- Jerarquia fuerte: shell, secciones, cards, estados y acciones deben tener pesos visuales claros.
- Dark mode disenado: superficies con profundidad, texto legible y estados sobrios.
- Light mode limpio: fondo suave, superficies elevadas, bordes sutiles y sombras discretas.
- Sin colores arbitrarios por pantalla si existe token semantico.

## Tokens consolidados

Tokens base reforzados:

- `background`
- `backgroundElevated`
- `surface`
- `surfaceAlt`
- `surfaceElevated`
- `surfaceMuted`
- `border`
- `borderSubtle`
- `borderStrong`
- `textPrimary`
- `textSecondary`
- `textMuted`
- `accent`
- `accentSoft`
- `success`
- `warning`
- `danger`
- `info`
- `inputBackground`
- `inputBorder`
- `inputText`
- `inputPlaceholder`
- `disabledBackground`
- `disabledText`
- `shadow`
- `focusRing`

## Componentes base

### AppCard

Se formalizaron variantes:

- `default`
- `elevated`
- `subtle`
- `warning`
- `success`
- `danger`
- `selected`

Las variantes controlan superficie, borde, acento lateral, sombra y elevacion.

### AppButton

Variantes disponibles:

- `primary`
- `secondary`
- `neutral`
- `ghost`
- `danger`
- disabled visual con motivo.

### StatusBadge

Mantiene tonos:

- `neutral`
- `success`
- `warning`
- `danger`
- `info`

Los badges usan tokens semanticos para mantener contraste en claro/oscuro.

### SectionHeader

Se convirtio en encabezado visual de seccion con:

- acento lateral;
- eyebrow contextual;
- titulo/subtitulo con mejor ritmo.

## Shell premium

### AppShell

- Agrega superficie ambiental superior.
- Mantiene sidebar fijo en desktop.
- Mantiene drawer en tablet/mobile.
- Usa ancho de contenido controlado.

### Sidebar

- Brand panel mas solido.
- Marca visual con icono de tienda y acento semantico.
- Separacion clara de secciones.
- Estado activo con `accentSoft`, no bloque solido pesado.
- Footer de sesion como tarjeta:
  - rol;
  - usuario;
  - correo;
  - cerrar sesion.

### TopBar

- Header contextual premium.
- No duplica usuario completo en desktop.
- Mantiene toggle claro/oscuro y acciones globales.

## Pantallas impactadas

### Inicio

Hereda:

- AppShell premium;
- cards elevadas;
- metricas con linea de acento;
- action tiles con mejor profundidad y acento lateral;
- empty states mas consistentes.

### LIVE

Sin cambiar reglas operativas:

- action tiles de preparacion mas premium;
- prenda al aire con superficie elevada;
- estados reservada/disponible con acentos, no fondos saturados;
- input de precio y helper texts legibles en claro/oscuro.

### Reservation detail

- `RestrictedSection` ahora usa `AppCard variant="warning"`.
- Cards y warnings heredan el sistema visual.
- No se cambio logica de pagos, permisos, 403 ni 404.

### UI Kit

`/ui-kit` ahora muestra:

- tokens;
- comparativo claro/oscuro;
- botones;
- inputs;
- cards por variante;
- badges;
- notices;
- templates;
- panel LIVE premium.

## No se cambio

- Backend.
- AUTH/RBAC.
- Pagos reales.
- Caja.
- Reportes financieros.
- Billing.
- IA.
- Reglas LIVE.
- Permisos LIVE.
- Contratos de API.

## Validacion visual recomendada

Rutas:

- `/`
- `/live`
- `/ui-kit`
- `/reservation-detail?id=<id valido>`

Usuarios:

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

Validar:

- no hay duplicidad de usuario en desktop;
- dark mode se ve disenado;
- light mode se ve limpio;
- botones tienen jerarquia;
- cards tienen consistencia;
- textos son legibles;
- no hay datos fake;
- responsive sin overflow.

## Riesgos

- Pantallas legacy que no usan AppShell o componentes base pueden seguir viendose menos premium.
- QA visual manual sigue siendo necesario en tablet/AnyDesk.

## GO / NO-GO

GO tecnico si validaciones automatizadas pasan.

GO visual condicionado a QA manual en rutas principales.

## Siguiente fase recomendada

PRODUCT-C2:

- Auditoria de pantallas legacy fuera del shell.
- Accesibilidad/contraste automatizable.
- Migracion gradual de listados y formularios antiguos a componentes base.

---

## Continuidad PRODUCT-C1 - Presets de identidad visual

Fecha: 2026-06-05

Se agrego base controlada de identidad visual por cliente mediante presets locales:

- `retailPremium`
- `darkConsole`
- `blueCorporate`
- `boutique`
- `classicErp`

Implementacion:

- `theme/designPresets.ts`
- `context/AppThemeContext.tsx`
- selector en `/ui-kit`

La seleccion se guarda localmente y afecta la app real mediante tokens semanticos. No se persiste en backend ni tenant todavia.

Ver `docs/PRODUCT_C_CLIENT_VISUAL_IDENTITY_PRESETS.md`.

---

## Continuidad PRODUCT-C2 - Editor controlado

Fecha: 2026-06-05

Se agrego un editor controlado de identidad visual sobre la plantilla activa. La resolucion del tema queda:

```text
preset base + overrides locales + light/dark mode = tokens finales
```

El editor vive en `/ui-kit`, valida colores hexadecimales `#RRGGBB`, permite restaurar la plantilla y guarda la personalizacion solo en frontend. No se agregaron endpoints, migraciones ni persistencia por tenant.

Ver `docs/PRODUCT_C2_VISUAL_IDENTITY_EDITOR.md`.

---

## Continuidad PRODUCT-D - QA operativo por roles

Fecha: 2026-06-05

PRODUCT-D formaliza la validacion por rol, ruta, permisos, tema claro/oscuro, presets visuales, editor controlado y responsive. La fase no cambia el sistema visual; agrega matriz, checklist y handoff para corrida manual real.

Ver:

- `docs/PRODUCT_D_ROLE_BASED_QA_MATRIX.md`
- `docs/PRODUCT_D_QA_CHECKLIST.md`
- `docs/PRODUCT_D_ROLE_BASED_QA_HANDOFF.md`

---

## Continuidad PRODUCT-D6.4 - Operacion legacy a AppShell

Fecha: 2026-06-06

PRODUCT-D6.4 extiende el sistema visual premium a pantallas operativas legacy:

- `/door-sale`
- `/door-reservation`
- `/items`
- `/items-create`
- `/batches`

La fase no cambia tokens ni reglas de negocio. Aplica `AppShellPage`, sidebar/drawer, active state e i18n principal para que venta puerta, apartado puerta, inventario, alta de prendas y lotes ya no se vean como pantallas aisladas.

---

## Continuidad PRODUCT-D6.5 - Auditoria legacy

Fecha: 2026-06-06

PRODUCT-D6.5 audita automaticamente rutas `app/*.tsx`, migra `/system-security` y `/system-sessions` a `AppShellPage`, y deja inventario documentado de rutas legacy restantes para priorizacion posterior.

---

## Continuidad PRODUCT-D6.6 - Rutas visibles restantes

Fecha: 2026-06-06

PRODUCT-D6.6 extiende el AppShell premium a rutas visibles de clientes, apartados/reservas, usuarios, inventario/lotes, pedidos y paquetes de cliente. La fase no cambia tokens ni reglas de negocio; reduce pantallas legacy y deja pendiente una limpieza de i18n profundo por dominio.

---

## Continuidad PRODUCT-I18N-A - Base multi-idioma

Fecha: 2026-06-06

PRODUCT-I18N-A agrega soporte base para `pt-BR`, `fr`, `ja`, `zh` y `ko` sin incorporar fuentes externas ni cambiar tokens visuales. La validacion visual debe revisar que AppShell, sidebar, botones, cards y theme toggle soporten textos largos y scripts asiaticos en light/dark y presets existentes. Las traducciones nuevas requieren revision humana/nativa antes de release internacional.

---

## Continuidad PRODUCT-I18N-B - Limpieza visual multi-idioma

Fecha: 2026-06-06

PRODUCT-I18N-B reduce mezclas visibles de idioma en LIVE, AppShell, sistema y formularios cercanos. No agrega fuentes ni cambia tokens; la revision visual debe enfocarse en overflow, legibilidad de scripts asiaticos, textos largos en frances/portugues y consistencia light/dark. La revision nativa sigue siendo requisito antes de release internacional.

---

## Continuidad PRODUCT-I18N-B.1 - Prestamos tecnicos y claves crudas

Fecha: 2026-06-06

PRODUCT-I18N-B.1 define un glosario visual para terminos tecnicos que pueden mantenerse como prestamos (`LIVE`, `QR`, `URL`, `UI Kit`, `API`, `ID`, `CSV`) y corrige claves crudas de LIVE. La revision visual debe asegurar que esos prestamos no rompan jerarquia, contraste, sidebar, dark mode ni responsive.

---

## Continuidad PRODUCT-C2.1 - Generador visual de paletas

Fecha: 2026-06-06

PRODUCT-C2.1 agrega en `/ui-kit` un generador visual de paletas con color base, armonias, tints, shades, tones, contraste basico y mini preview real de UI. La aplicacion sigue sin persistencia backend por tenant: las paletas se aplican localmente usando los overrides de PRODUCT-C2.

La validacion visual debe revisar que las paletas aplicadas conserven legibilidad en AppShell, LIVE, clientes, light/dark y responsive. Si el panel marca bajo contraste, QA debe tratarlo como advertencia antes de aceptar la combinacion.

---

## Continuidad PRODUCT-C2.2 - Identidad visual guiada

Fecha: 2026-06-06

PRODUCT-C2.2 simplifica `/ui-kit` para que el usuario vea primero un flujo de identidad visual guiado: plantilla activa, color base, paleta sugerida, contraste principal, preview real y acciones de aplicar/restaurar. El contenido avanzado del laboratorio visual queda colapsado por defecto.

La validacion visual debe confirmar que la simplificacion no elimina el generador, no rompe los overrides locales, no oculta la restauracion de plantilla y mantiene disponible el modo avanzado para tokens, componentes, templates, variantes y detalles tecnicos.

---

## Continuidad PRODUCT-C2.3 - Diseno visual de la aplicacion

Fecha: 2026-06-07

PRODUCT-C2.3 reposiciona `/ui-kit` como pantalla de `Diseno de la aplicacion`: la configuracion visible ahora explica que se cambia la plantilla visual, el color principal, la paleta sugerida, contraste, legibilidad y preview antes de aplicar cambios locales.

El sistema visual premium conserva presets, light/dark, overrides locales y modo avanzado. QA debe validar que el usuario entienda la secuencia sin abrir opciones tecnicas.

---

## Continuidad PRODUCT-C2.4 - Selector propio y colores de marca

Fecha: 2026-06-07

PRODUCT-C2.4 agrega un selector propio de color para `/ui-kit` y evita que la experiencia principal dependa del picker nativo de navegador/Windows. El flujo de diseno visual soporta color principal, secundario y acento, con preview y contraste antes de aplicar localmente.

QA debe validar que el panel propio respete light/dark, presets, responsive y que los tres colores se reflejen en sidebar, cards, botones, chips/acento, badges y estados sin perder legibilidad.

---

## Continuidad PRODUCT-C2.5 - Editor de marca simplificado

Fecha: 2026-06-07

PRODUCT-C2.5 simplifica la superficie principal de `/ui-kit`: plantillas, colores de marca, paleta sugerida, legibilidad, preview y acciones finales. Las variaciones de color se abren desde el picker propio y los tokens quedan como diagnostico avanzado.

QA debe confirmar que la vista inicial ya no se perciba como laboratorio tecnico y que el modo avanzado conserve las herramientas internas.

---

## Continuidad PRODUCT-C2.6 - Selector compacto y armonia no limitante

Fecha: 2026-06-07

PRODUCT-C2.6 mejora el picker propio y la explicacion de armonia. El sistema visual respeta colores de marca definidos y usa armonia solo para sugerir faltantes. El modal de color usa pestañas compactas y keys compuestas para evitar duplicados.
