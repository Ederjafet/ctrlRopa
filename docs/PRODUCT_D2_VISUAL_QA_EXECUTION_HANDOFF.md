# PRODUCT-D2 - Handoff de corrida visual/manual QA por roles

## Proposito

PRODUCT-D2 prepara la ejecucion manual real de QA visual por rol, ruta, tema, preset y dispositivo. Este documento no marca resultados visuales como aprobados; define como ejecutar, capturar evidencia y reportar hallazgos.

## Alcance

Validar manualmente:

- login/logout por usuario QA;
- navegacion AppShell en desktop/tablet/mobile;
- rutas principales autenticadas;
- vistas LIVE por capacidades;
- tema claro/oscuro;
- presets visuales PRODUCT-C1;
- editor controlado PRODUCT-C2;
- prenda reservada rojo premium;
- detalle de reserva con permisos/restriccion pagos.

Fuera de alcance:

- cambios backend;
- cambios AUTH/RBAC;
- pagos/caja reales;
- reportes backend;
- billing;
- IA;
- reglas LIVE nuevas.

## Preparar entorno

Backend:

```powershell
cd backend/control-ropa
.\mvnw.cmd spring-boot:run
```

Frontend web:

```powershell
npm.cmd run start -- --host 0.0.0.0
```

Alternativa Expo habitual si el comando anterior no abre web automaticamente:

```powershell
npx.cmd expo start --web
```

URL esperada:

```text
http://localhost:8081
```

Si el puerto ya esta ocupado, usar el puerto reportado por Expo.

## Usuarios QA

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

No duplicar contrasenas en evidencia. Usar credenciales internas QA vigentes.

## Orden recomendado

1. Admin en desktop, light, `retailPremium`.
2. Admin en desktop, dark, `darkConsole`.
3. Admin en `/ui-kit`: cambiar preset, aplicar editor local y restaurar.
4. Admin en `/live`: validar consola, prenda reservada y reservas recientes.
5. Vendedor en tablet/mobile: validar vista apoyo y acciones bloqueadas.
6. Supervisor en desktop dark: validar dashboard/monitoreo.
7. Sin permisos en desktop/mobile: validar bloqueo y ausencia de navegacion util.
8. Detalle de reserva con id valido: validar permisos y secciones restringidas.

## Dispositivos / viewports

- Desktop: 1366px o mas.
- Tablet: 768px a 1199px.
- Mobile: 360px a 430px.
- AnyDesk/pantalla remota: validar que sidebar/drawer no comprima contenido.

## Que capturar

Por caso:

- screenshot o video corto;
- usuario;
- ruta;
- viewport/dispositivo;
- tema;
- preset;
- resultado real;
- estado PASS/FAIL/BLOQUEADO;
- severidad si falla.

Guardar evidencia con nombre sugerido:

```text
PRODUCT-D2_<ID>_<usuario>_<ruta>_<tema>_<dispositivo>.png
```

## Como llenar CSV

Archivo:

```text
qa-reports/PRODUCT-D2-visual-qa-execution-smoke-YYYYMMDD-HHMMSS.csv
```

Campos importantes:

- `Resultado real`: lo que se observo.
- `Estado`: `PASS`, `FAIL`, `BLOQUEADO`, `NO_APLICA` o `PENDIENTE_MANUAL`.
- `Evidencia`: nombre/ruta del screenshot o nota.
- `Severidad si falla`: `S1`, `S2`, `S3`, `S4`.

No marcar PASS sin evidencia manual real.

## Severidad

- S1: exposicion de permisos, accion critica no autorizada, bloqueo total.
- S2: flujo principal roto, LIVE incorrecto por rol, tema ilegible en ruta clave.
- S3: problema visual importante, responsive defectuoso, texto secundario poco legible.
- S4: detalle menor de copy, spacing o pulido visual.

## Si falla

1. Registrar caso y evidencia.
2. No corregir directamente en esta corrida si requiere cambios funcionales.
3. Abrir PRODUCT-D3 para correcciones puntuales.
4. Si es un hallazgo de seguridad/permisos, tratar como S1/S2 y no aprobar merge.

## Criterios de cierre

GO tecnico:

- lint, TypeScript, export web, Maven test/package y `git diff --check` pasan.

GO visual:

- pendiente hasta ejecutar manualmente el CSV y adjuntar evidencias.

NO-GO visual:

- cualquier S1;
- S2 sin workaround seguro;
- UI Kit/editor accesible para no admin;
- vendedor/supervisor con vista equivocada;
- textos criticos invisibles;
- pagos consultados sin `VIEW_PAYMENTS`.
