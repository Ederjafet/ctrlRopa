# PRODUCT-A - UI Library Spike

Proyecto: control-ropa-app
Rama: feature/product-a-ui-library-spike
Base: d14bf4a
Fecha: 2026-06-03

## Objetivo

Evaluar si conviene adoptar Tamagui, NativeWind, gluestack UI, React Native Paper o continuar con componentes propios basados en `StyleSheet` para mejorar la UI de control-ropa-app sin romper Expo/Web, LIVE-Z5 ni las pantallas ERP existentes.

El spike no instala librerias ni migra pantallas. La decision se basa en:

- estado real del proyecto;
- compatibilidad Expo SDK 54 / React Native 0.81 / React 19;
- riesgo de configuracion;
- impacto en `npx expo export --platform web`;
- capacidad de evolucionar un design system interno por fases.

## Estado actual visual

El proyecto ya tiene una base de UI propia:

- `context/AppThemeContext.tsx` define tokens de color, espaciado, radio, densidad y estilo de botones.
- `components/ui/AppButton.tsx`, `AppCard.tsx`, `AppInput.tsx`, `AppText.tsx`, `AppScreen.tsx`, `AppResponsiveGrid.tsx` y otros componen una libreria interna minima.
- `app/_layout.tsx` ya envuelve la app con `AppThemeProvider`, `SafeAreaProvider` e `I18nextProvider`.
- `app/live.tsx` es grande y sensible: 5562 lineas, con flujo LIVE-Z5 reciente y dependencias funcionales de permisos, polling ligero, reservas, eventos y producto activo.
- `app/reservation-detail.tsx` tiene 760 lineas y ya se mejoro para tarjetas y secciones restringidas.
- El repo usa `StyleSheet.create` en muchas pantallas; no hay `className`, `tamagui`, `nativewind`, `gluestack` ni `react-native-paper`.
- No hay `babel.config.*`, `metro.config.*`, `tailwind.config.*` ni `nativewind-env.d.ts` en la raiz.

Esto significa que una libreria con configuracion global puede afectar toda la app. La opcion mas segura para PRODUCT-A es no introducir dependencia global todavia.

## Referencias revisadas

- Tamagui Expo guide: https://tamagui.dev/docs/guides/expo
- NativeWind platform differences: https://www.nativewind.dev/docs/core-concepts/differences
- NativeWind installation: https://www.nativewind.dev/docs/getting-started/installation/frameworkless
- gluestack UI v5 installation: https://v5.gluestack.io/ui/docs/home/getting-started/installation
- React Native Paper: https://reactnativepaper.com/
- Expo Web workflow: https://docs.expo.dev/workflow/web/

## Librerias evaluadas

### Tamagui

Ventajas:

- Muy fuerte para design systems cross-platform con tokens, temas, variantes y componentes.
- Puede dar una UI premium si se adopta bien.
- Tiene guia especifica para Expo y Web.

Riesgos:

- Requiere agregar `tamagui`, `@tamagui/config`, `tamagui.config.ts`, provider global y posiblemente Babel/Metro/compilador.
- La guia oficial para Expo contempla cambios de layout/provider, CSS generado y carga de fuentes.
- Puede ser potente pero invasivo para una app con `AppThemeContext` propio, Expo Router y LIVE-Z5 recien estabilizado.
- Riesgo alto de romper `expo export --platform web` si se configura a medias.
- Curva de aprendizaje alta para equipo y mantenimiento.

Decision PRODUCT-A: NO-GO para instalar ahora. Evaluar solo en sandbox/rama aislada futura con una pantalla nueva, no sobre `app/live.tsx`.

### NativeWind

Ventajas:

- Sintaxis Tailwind acelera estilos.
- Buena compatibilidad conceptual con Expo y RN Web.
- Puede servir para prototipos rapidos.

Riesgos:

- Requiere Tailwind/configuracion, posiblemente Babel/Metro y convenciones `className`.
- Introduce un segundo lenguaje visual al lado de `AppThemeContext`.
- Las diferencias RN/Web obligan a declarar estilos con cuidado.
- Migrar pantallas actuales implicaria tocar mucho JSX.

Decision PRODUCT-A: NO-GO como dependencia global ahora. Puede probarse en sandbox si se quiere explorar velocidad visual, pero no como base inmediata de producto.

### gluestack UI

Ventajas:

- Componentes listos para React Native/Expo.
- Puede acelerar formularios, botones, modales y layouts.
- v5 apunta a Expo/RN moderno.

Riesgos:

- Instalacion por CLI que modifica provider, Metro, Babel, CSS/globales.
- v5 usa NativeWind v5/UniWind como motor, agregando otra capa de riesgo.
- Documentacion oficial marca pasos automaticos e issues comunes con peer deps/build.
- Puede traer mas superficie que lo necesario para una app ERP con UI propia ya iniciada.

Decision PRODUCT-A: NO-GO para instalar ahora. Considerar solo si en PRODUCT-B se desea un piloto de componentes aislados y el CLI se prueba en rama desechable.

### React Native Paper

Ventajas:

- Biblioteca madura de Material Design, web/mobile y TypeScript.
- Menor friccion que Tamagui/gluestack porque no exige Tailwind ni compiler.
- Buena para pantallas ERP/admin: inputs, dialogs, menus, data-ish UI basica.
- Theming y accesibilidad integrados.

Riesgos:

- Estetica Material puede sentirse generica si no se personaliza.
- Puede chocar visualmente con el look tablet-first de LIVE si se mezcla sin wrapper.
- Requiere provider/theme y adaptacion gradual.
- Puede duplicar `AppButton`, `AppCard`, `AppInput` si no se gobierna bien.

Decision PRODUCT-A: opcion externa mas segura si se decide probar una libreria. GO solo para piloto puntual en PRODUCT-B, por ejemplo un `ProductUiKitSandbox` o una pantalla interna no critica.

### Componentes propios con StyleSheet

Ventajas:

- Ya existen y pasan lint, TS y export.
- Maximo control sobre densidad ERP, tablet-first LIVE, permisos y estados.
- Sin riesgo de configuracion global ni dependencia nueva.
- Permite evolucionar por fases: tokens, variantes, estados, grid, cards, tabs, modales, badges.
- Compatible con los ajustes dinamicos existentes de apariencia.

Riesgos:

- Requiere disciplina de design system; si no, se siguen acumulando estilos por pantalla.
- Menos componentes listos que una libreria externa.
- Requiere crear patrones para tablas/listas densas, toolbars, estados vacios, badges y forms.

Decision PRODUCT-A: GO recomendado. Formalizar un design system interno y extraer patrones antes de instalar librerias.

## Tabla comparativa

| Opcion | Expo | RN Web | TypeScript | Riesgo instalacion | Riesgo export web | Reescritura | LIVE tablet-first | ERP/admin | Design system interno | Licencia/costo | Recomendacion |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Tamagui | Alta compatibilidad teorica | Alta | Alta | Alto | Medio/alto | Alta si se adopta completo | Muy bueno si se domina | Bueno | Muy fuerte | OSS, Pro opcional | NO-GO ahora; sandbox futuro. |
| NativeWind | Buena | Buena con diferencias | Buena | Medio/alto | Medio | Media/alta | Bueno para prototipo | Variable | Medio, depende de tokens Tailwind | OSS | NO-GO ahora; no mezclar global. |
| gluestack UI | Buena | Buena para RN/Expo | Buena | Alto por CLI/motor | Medio/alto | Media | Bueno | Bueno | Medio/alto | OSS | NO-GO ahora; piloto aislado si se desea. |
| React Native Paper | Buena | Declarado web/mobile | Buena | Bajo/medio | Bajo/medio | Baja/media | Medio; requiere customizacion | Muy bueno | Medio | OSS | GO solo para piloto puntual. |
| Propios + StyleSheet | Ya probado | Ya probado | Ya probado | Bajo | Bajo | Baja | Muy bueno | Muy bueno | Alto si se formaliza | Sin costo extra | GO recomendado. |

## Riesgos

- `app/live.tsx` ya fue muy intervenido en LIVE-Z5; migrarlo ahora aumenta riesgo de regresion.
- No hay configuracion Babel/Metro/Tailwind; agregarla sin necesidad puede romper export web.
- Una libreria externa puede duplicar el tema existente y pelear con configuracion de apariencia desde backend.
- NativeWind/gluestack/Tamagui requieren convenciones nuevas que afectarian onboarding y mantenimiento.
- Paper es la opcion externa menos riesgosa, pero su estetica Material no resuelve por si sola la identidad visual vendible.

## Compatibilidad

- Expo/Web actual: probado con `npx expo export --platform web`.
- TypeScript estricto: activo.
- React Compiler: activo en `app.json`.
- RN Web: instalado.
- Reanimated: instalado; relevante para NativeWind/gluestack/Tamagui.
- No hay Tailwind, NativeWind, Tamagui, gluestack ni Paper instalados.

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -12`
- `git switch -c feature/product-a-ui-library-spike`
- `Get-Content package.json`
- `Get-ChildItem -Force`
- `rg --files app components services constants context hooks`
- `Get-Content tsconfig.json`
- `Get-Content app.json`
- `Get-ChildItem -Force -Name babel.config.*,metro.config.*,tailwind.config.*,nativewind-env.d.ts`
- `Get-Content constants/theme.ts`
- `Get-Content context/AppThemeContext.tsx`
- `Get-Content components/ui/AppButton.tsx`
- `Get-Content components/ui/AppCard.tsx`
- `Get-Content components/ui/AppResponsiveGrid.tsx`
- `Get-Content app/_layout.tsx`
- `rg -n "StyleSheet\\.create"`
- `rg -n "from 'react-native-paper'|from 'tamagui'|nativewind|gluestack|className="`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
- `./mvnw.cmd test`
- `./mvnw.cmd -q -DskipTests package`

## Recomendacion

GO para continuar con componentes propios + `StyleSheet`, pero formalizados como UI Kit interno.

Recomendacion concreta:

1. Crear `components/ui-kit/` o fortalecer `components/ui/` con tokens y variantes.
2. Extraer de LIVE-Z5 componentes reutilizables:
   - `StatusBadge`;
   - `MetricCard`;
   - `EntitySummaryCard`;
   - `ActionTile`;
   - `SectionHeader`;
   - `DataGridLite`;
   - `RestrictedPanel`;
   - `Timeline/EventList`.
3. Mantener `AppThemeContext` como fuente de tokens.
4. No reescribir `app/live.tsx` todavia; primero crear componentes y migrar secciones pequeñas.
5. Si se quiere evaluar libreria externa, probar React Native Paper en PRODUCT-B como sandbox aislado, no como migracion global.

## GO / NO-GO

- Tamagui: NO-GO para instalacion en PRODUCT-A.
- NativeWind: NO-GO para instalacion en PRODUCT-A.
- gluestack UI: NO-GO para instalacion en PRODUCT-A.
- React Native Paper: GO condicionado para piloto aislado futuro.
- Componentes propios con StyleSheet: GO recomendado.

## Siguiente fase recomendada

PRODUCT-B: `internal-ui-kit-foundation`.

Alcance sugerido:

- Crear tokens/contratos internos de UI.
- Crear 6-8 componentes base reutilizables.
- Aplicarlos solo a una zona no destructiva: resumen LIVE cerrado, dashboard supervisor o reservation-detail.
- Mantener validaciones `lint`, `tsc` y `expo export`.
- No instalar libreria externa hasta que el UI kit interno pruebe limites reales.
