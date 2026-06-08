# PRODUCT-D4 - Ejecucion manual QA visual con evidencia real

> Referencia PROJECT-GOV-A: usar `docs/QA_TODO_HANDOFF.md` como checklist QA actualizado y `docs/QA_RESULTS_LOG.md` como bitacora central de resultados reales.

> Actualizacion PRODUCT-D4 REAL: la corrida nueva se prepara en `docs/PRODUCT_D4_REAL_QA_EXECUTION_PLAN.md` y `docs/PRODUCT_D4_REAL_QA_TEST_MATRIX.md`. La plantilla de resultados esta en `qa-reports/manual-evidence/PRODUCT-D4-REAL-QA-results-template-20260608.md`.

> Actualizacion LIVE-FIX-A: agregar a la corrida manual que `CAMBIAR POR PRENDA PREPARADA` muestre aviso si no hay prenda preparada y que `Cerrar como venta LIVE` use confirmacion visual accionable.

> Complemento LIVE-FIX-A: validar que la accion inversa posterior a una venta LIVE diga `Deshacer cierre de venta LIVE`, que sea distinta de `Cancelar apartado` y que ambos helpers aclaren que no registran pago ni caja.

## Objetivo

PRODUCT-D4 existe para convertir los casos `PENDIENTE_MANUAL` de PRODUCT-D2/D3 en resultados reales: `PASS`, `FAIL`, `BLOQUEADO` o `NO_APLICA`, siempre con evidencia capturada.

## Fuentes revisadas

- `docs/PRODUCT_D_ROLE_BASED_QA_MATRIX.md`
- `docs/PRODUCT_D_QA_CHECKLIST.md`
- `docs/PRODUCT_D_ROLE_BASED_QA_HANDOFF.md`
- `docs/PRODUCT_D2_VISUAL_QA_EXECUTION_HANDOFF.md`
- `docs/PRODUCT_D3_VISUAL_QA_RESULTS.md`
- `qa-reports/PRODUCT-D2-visual-qa-execution-smoke-20260605-122258.csv`
- `qa-reports/PRODUCT-D3-visual-qa-results-report-20260605-124421.md`

## Estado encontrado

El CSV base de PRODUCT-D2 contiene 28 casos y todos siguen en `PENDIENTE_MANUAL`.

No se encontraron resultados reales ni referencias de evidencia visual capturada:

- `PASS`: 0
- `FAIL`: 0
- `BLOQUEADO`: 0
- `NO_APLICA`: 0
- `PENDIENTE_MANUAL`: 28
- casos con evidencia referenciada: 0
- casos con resultado real: 0

## Estructura de evidencia

Se preparo la carpeta:

- `qa-evidence/PRODUCT-D4/`

Con subcarpetas por perfil:

- `admin/`
- `vendedor/`
- `supervisor/`
- `sin-permisos/`

Y por combinacion inicial de dispositivo/tema:

- `desktop-light/`
- `desktop-dark/`
- `mobile-light/`
- `mobile-dark/`

## CSV operativo

Se creo:

- `qa-reports/PRODUCT-D4-manual-qa-evidence-smoke-20260605-125218.csv`

El archivo se basa en el smoke de PRODUCT-D2 y agrega la columna `Fecha ejecucion`.

Regla de uso:

- no cambiar `Estado` a `PASS` sin evidencia;
- no cambiar `Estado` a `FAIL` sin resultado real y evidencia;
- usar `BLOQUEADO` solo si el caso no puede ejecutarse por bloqueo verificable;
- usar `NO_APLICA` solo cuando la ruta/permiso/condicion no corresponda y quede explicado en notas;
- conservar `PENDIENTE_MANUAL` cuando no se haya ejecutado.

## Resumen por severidad potencial

Como no hay hallazgos confirmados, esta tabla representa severidad potencial de los casos pendientes:

| Severidad | Casos pendientes |
| --- | ---: |
| S1 | 6 |
| S2 | 11 |
| S3 | 10 |
| S4 | 1 |

## Evidencias faltantes

Falta evidencia para los 28 casos del smoke PRODUCT-D4, incluyendo:

## Anexo LIVE-Z10A - Autorizacion de precio LIVE

Agregar evidencia manual para el flujo de cambio de precio LIVE:

- usuario sin `canChangeLivePrice` en `/live`;
- prenda al aire visible;
- precio LIVE en solo lectura;
- mensaje claro de autorizacion no disponible;
- ausencia de modal de motivos de autorizacion;
- ausencia de `Solicitud pendiente`;
- validacion light/dark y mobile/tablet.

Resultado esperado: la app no simula una solicitud de autorizacion y no permite cambio libre de precio sin capacidad real.

- capturas de `/`, `/live`, `/ui-kit`, `/customers`, `/reservations`, `/users`, `/system`, `/reports`, `/appearance` si existe y `reservation-detail`;
- ejecucion con usuarios `qa.admin@local.test`, `qa.vendedor.centro@local.test`, `qa.supervisor.centro@local.test` y `qa.sinpermisos@local.test`;
- validacion light/dark;
- validacion de presets visuales;
- validacion de prenda reservada rojo premium;
- validacion responsive desktop/tablet/mobile;
- validacion de permisos, bloqueo y ausencia de acciones indebidas.

## Criterio GO/NO-GO

- GO tecnico: depende de validaciones automaticas.
- NO-GO visual: mientras todos los casos sigan `PENDIENTE_MANUAL`.
- NO-GO obligatorio: si se confirma algun S1 o S2.
- GO condicionado: si solo existen S3/S4 aceptados por negocio y documentados.
- GO visual: solo cuando los casos criticos tengan evidencia real suficiente.

## Recomendacion

Ejecutar la corrida manual real y llenar el CSV PRODUCT-D4. Si aparecen S1/S2 confirmados, abrir PRODUCT-D5 para correcciones puntuales. Si solo quedan S3/S4 aceptables, se puede evaluar avanzar a PRODUCT-E con riesgo documentado.

## Nota LIVE-Z9B

La validacion manual posterior debe revisar tambien:

- uso consistente de `Apartado` en la pantalla LIVE;
- `Apartar ahora`;
- `Cerrar como venta LIVE`;
- `Mantener apartado`;
- diferencia entre `Retirar prenda del aire`, `Cambiar por prenda preparada` y `Finalizar en vivo`;
- que apartar la prenda al aire no oculte la prenda preparada para cambio.

## Nota LIVE-Z9E

La corrida manual desde LIVE debe agregar el caso `Crear prenda rapida`:

- abrir `/items-create?returnTo=/live`;
- dejar un campo obligatorio vacio, especialmente `Talla`;
- presionar `Generar prendas`;
- confirmar que aparece dialogo accionable de validacion y error visible por campo;
- confirmar botones `Entendido` e `Ir al primer campo`;
- completar datos validos;
- confirmar que la creacion correcta mantiene el regreso a LIVE.

## Nota LIVE-Z9F

La corrida manual debe validar que el bloqueo de alta rapida de prendas se muestra como guia operativa, no como error tecnico:

- titulo `Falta informacion para generar la prenda`;
- detalle de campos faltantes;
- formulario conserva valores capturados;
- helpers inline permanecen visibles;
- `Ir al primer campo` abre el selector o enfoca el primer campo invalido.

## Nota PRODUCT-D6.4

La siguiente corrida manual debe confirmar AppShell/sidebar/drawer y ausencia de navegacion legacy en:

- `/door-sale`;
- `/door-reservation`;
- `/items`;
- `/items-create?returnTo=%2Flive`;
- `/batches`.

Validar tambien active state correcto, idioma Espanol/English, light/dark, presets visuales y responsive desktop/tablet/mobile.

## Nota PRODUCT-D6.5

Agregar a la corrida manual:

- `/system-security`;
- `/system-sessions`.

Confirmar AppShell/sidebar/drawer, active state correcto, ausencia de `Menu principal` legacy, idioma Espanol/English, light/dark y mobile/drawer.

## Nota PRODUCT-D6.6

Agregar a la corrida manual las rutas visibles migradas:

- `/customers`;
- `/customers-create`;
- `/customers/<id valido>`;
- `/customer-addresses-create?customerId=<id valido>`;
- `/reservations`;
- `/users`;
- `/items/<id valido>`;
- `/batch-form`;
- `/batch-detail?id=<id valido>`;
- `/customer-orders`;
- `/customer-order-detail?id=<id valido>`;
- `/customer-packages`;
- `/customer-package-detail?id=<id valido>`.

Confirmar AppShell/sidebar/drawer, active state correcto, ausencia de `Menu principal` legacy en rutas migradas, light/dark, presets visuales y responsive desktop/tablet/mobile.

## Nota LIVE-Z9F.1

Agregar a la corrida manual de LIVE:

- intentar apartar sin cliente/interesado;
- confirmar panel contextual `No se puede agregar apartado`;
- confirmar acciones `Seleccionar cliente` y `Cerrar`;
- intentar apartar sin prenda al aire;
- confirmar panel contextual con `Entendido`;
- validar que `items-create?returnTo=%2Flive` mantiene dialogo modal para campos faltantes;
- validar light/dark, presets visuales y mobile/tablet.

## Nota LIVE-Z9G

Agregar a la corrida manual de LIVE con `qa.vendedor.centro@local.test`:

- confirmar que el vendedor con `DO_LIVE_RESERVATION` ve flujo de apartado y no solo apoyo visual;
- confirmar que puede seleccionar cliente si conserva `VIEW_CUSTOMERS`;
- confirmar que puede crear apartado LIVE con prenda al aire y precio valido;
- confirmar que no ve iniciar/cerrar LIVE ni cambiar prenda al aire;
- confirmar que no ve cancelar apartado si no tiene `CANCEL_RESERVATION`;
- confirmar que `Cerrar como venta LIVE` solo aparece si conserva permiso real de venta operativa;
- repetir validacion en light/dark y mobile/tablet.

## Nota LIVE-Z9H

Agregar a la corrida manual de LIVE:

- dejar `qa.vendedor.centro@local.test` dentro de `/live` mientras Admin inicia o cambia el LIVE;
- confirmar boton `Actualizar`;
- confirmar indicador `Ultima actualizacion`;
- confirmar que prenda al aire, precio y apartados recientes se refrescan sin salir/entrar;
- repetir con `qa.supervisor.centro@local.test`;
- ocultar y volver a enfocar la ventana para confirmar refresh al foco;
- confirmar que no hay polling util para `qa.sinpermisos@local.test`;
- confirmar light/dark y mobile/tablet.

## Nota PRODUCT-I18N-A

Agregar a la corrida manual multi-idioma:

- abrir `/system` con `qa.admin`;
- seleccionar `Português Brasil`, `Français`, `日本語`, `中文` y `한국어`;
- confirmar que AppShell/sidebar/topbar/theme toggle/logout cambian con el idioma activo;
- abrir `/live`, `/customers`, `/reservations`, `/users`, `/reports`, `/ui-kit` y `/appearance`;
- confirmar que no aparecen `undefined`, `null` ni claves crudas;
- revisar textos largos en portugues/frances y scripts asiaticos en desktop/tablet/mobile;
- confirmar light/dark y persistencia al refrescar navegador.

Las traducciones nuevas son base tecnica y deben pasar por revision humana/nativa antes de release internacional.

## Nota PRODUCT-I18N-B

Agregar a la corrida manual de limpieza de idioma:

- cambiar a japones, chino simplificado y coreano desde `/system`;
- abrir `/live` y confirmar que el flujo principal no mezcla ingles/espanol en botones, helpers, precio, cliente, apartado, prenda al aire y prenda preparada;
- repetir revision en frances y portugues Brasil para navegacion, AppShell y LIVE;
- confirmar que `LIVE`, `QR`, `URL` y placeholders `{{...}}` se conservan como terminos tecnicos cuando aplica;
- confirmar que pagos/caja no se consideran parte de esta fase;
- validar light/dark.

## Nota PRODUCT-I18N-B.1

Agregar a la corrida manual:

- abrir `/live` en japones, chino y coreano;
- confirmar que no aparece la clave cruda `live.size`;
- confirmar que talla aparece localizada;
- revisar que `UI Kit`/`UIキット` no se vea roto en sidebar ni en modo oscuro;
- confirmar que `LIVE`, `QR`, `URL`, `API`, `ID` y `CSV` se mantienen como prestamos tecnicos cuando aparezcan;
- confirmar que no aparecen claves crudas `live.*`, `navigation.*`, `system.*`, `common.*` en los flujos principales.

## Nota PRODUCT-C2.1

Agregar a la corrida manual de sistema visual:

- entrar con `qa.admin`;
- abrir `/ui-kit`;
- elegir un color base en el generador visual;
- revisar tints, shades, tones y armonias;
- confirmar que el panel de contraste muestra ratio y estado;
- aplicar la paleta localmente;
- confirmar que preview, editor HEX y tema aplicado cambian;
- abrir `/live` y `/customers` para validar que la identidad local se refleja en pantallas reales;
- cambiar light/dark y revisar contraste;
- volver a `/ui-kit` y restaurar plantilla;
- abrir `/appearance` y confirmar que aparece acceso al generador avanzado sin romper campos de branding.

## Nota PRODUCT-C2.2

Agregar a la corrida manual de sistema visual:

- abrir `/ui-kit`;
- confirmar que la primera vista es un flujo guiado y no un listado largo de laboratorio;
- confirmar plantilla activa, color base, paleta sugerida, contraste principal y preview real;
- aplicar paleta localmente y abrir `/live` o `/customers` para validar efecto visual;
- restaurar plantilla;
- abrir detalles avanzados;
- confirmar que tokens, componentes, templates y variantes siguen disponibles, pero no saturan la vista inicial;
- repetir en light/dark y mobile/tablet.

## Nota PRODUCT-C2.3

Agregar a la corrida manual de sistema visual:

- abrir `/ui-kit`;
- confirmar que el encabezado principal dice `Diseno de la aplicacion`;
- confirmar que los pasos explican la secuencia completa;
- elegir plantilla visual;
- elegir color principal de marca;
- revisar paleta sugerida con nombres entendibles;
- revisar contraste y legibilidad;
- confirmar que la vista previa aparece antes de aplicar cambios;
- aplicar paleta localmente;
- restaurar plantilla;
- abrir opciones avanzadas y confirmar que el contenido tecnico no satura por defecto;
- abrir `/appearance` y confirmar tarjeta `Diseno de la aplicacion` con boton `Abrir editor visual`.

## Nota PRODUCT-C2.4

Agregar a la corrida manual de sistema visual:

- abrir `/ui-kit`;
- ir a `Colores de marca`;
- cambiar color principal y confirmar que no se abre la ventana nativa de Windows como experiencia principal;
- cambiar color secundario;
- cambiar color de acento;
- confirmar que la paleta sugerida respeta los colores definidos;
- revisar contraste de principal, secundario, acento, fondo, superficie y reservado;
- confirmar que la preview refleja sidebar, card, boton primario, boton secundario, chip/acento, badge activo y badge reservado;
- aplicar paleta localmente;
- abrir `/live` o `/customers` y confirmar tema aplicado;
- volver a `/ui-kit` y restaurar plantilla;
- validar light/dark y mobile/tablet.

## Nota PRODUCT-C2.5

Agregar a la corrida manual de sistema visual:

- abrir `/ui-kit`;
- confirmar que la vista principal muestra solo plantilla visual, colores de marca, paleta sugerida, legibilidad, preview, aplicar/restaurar y opciones avanzadas;
- confirmar que `tints`, `shades` y `tones` ya no ocupan espacio en la pantalla principal;
- cambiar principal, secundario y acento y confirmar que claros/oscuros/desaturados aparecen dentro del modal `Cambiar color`;
- confirmar que armonia aparece como sugerencia avanzada, no como limitante del flujo principal;
- revisar que `Identidad visual local` se muestre en avanzado como `Editor avanzado de tokens locales`;
- revisar que `Design tokens` solo aparezca en avanzado como diagnostico tecnico;
- aplicar paleta localmente;
- restaurar plantilla;
- validar light/dark y mobile/tablet.

## Nota PRODUCT-C2.6

Agregar a la corrida manual de sistema visual:

- abrir `/ui-kit`;
- definir solo principal y confirmar que armonia se presenta como ayuda para sugerir secundario/acento;
- definir principal + secundario y confirmar que armonia solo sugiere acento;
- definir principal + secundario + acento y confirmar mensaje `Usando colores de marca definidos`;
- abrir `Cambiar color` para principal, secundario y acento;
- confirmar header especifico del color editado;
- revisar tabs `Muestras`, `Claros`, `Oscuros`, `Desaturados`;
- confirmar que no aparece warning `Encountered two children with the same key`;
- aplicar color y confirmar que la paleta/preview se actualizan;
- validar light/dark y mobile/tablet.

## Nota LIVE-Z9I

Agregar a la corrida manual de LIVE:

- entrar con `qa.admin`;
- abrir `/live`;
- abrir `Buscar prenda`;
- confirmar filtro por defecto `Disponibles`;
- confirmar que vendidas/reservadas no aparecen por defecto;
- cambiar a `Todas`;
- confirmar que vendidas/reservadas aparecen con motivo;
- cambiar a `Apartadas` y `Vendidas / no disponibles`;
- buscar por codigo, tipo, marca o talla;
- confirmar que la busqueda conserva el filtro activo;
- intentar seleccionar una vendida/no disponible y confirmar bloqueo claro;
- validar light/dark y mobile/tablet.

## Nota LIVE-Z9I.1

Agregar a la corrida manual de LIVE:

- entrar con `qa.admin`;
- abrir `/live`;
- preparar una prenda;
- confirmar que en desktop/tablet `Poner esta prenda al aire` y `Quitar prenda preparada` aparecen en una sola linea;
- reducir ancho o abrir mobile;
- confirmar que esos botones se apilan correctamente;
- revisar `Prenda al aire ahora`;
- confirmar que sus acciones tambien quedan en fila con espacio suficiente y apiladas en mobile;
- validar light/dark.

## Nota PRODUCT-ERR-A

Agregar a la corrida manual de errores frontend:

- detener backend o simular error de red;
- abrir `/door-reservation` y confirmar mensaje accionable, no `Ocurrio un error interno inesperado`;
- abrir `/door-sale` y confirmar que los fallos de carga/creacion muestran guia de reintento o soporte;
- abrir `/live` y validar errores de carga, refresh y acciones operativas con mensajes limpios;
- abrir `/items-create`, `/customers`, `/reservations` y `/users`;
- probar un usuario sin permiso si aplica y confirmar mensaje de solicitud de acceso;
- confirmar que no se muestran stack traces, SQL, endpoints completos ni claves crudas;
- validar ES/EN/PT/FR/JA/ZH/KO y light/dark.

## Nota LIVE-Z9J

Agregar a la corrida manual multiusuario de LIVE:

- entrar con `qa.admin` u operador y abrir `/live`;
- entrar con vendedor en otro navegador/dispositivo y abrir `/live`;
- crear un apartado desde vendedor;
- confirmar que operador/admin lo ve sin salir/entrar;
- confirmar aviso `Nuevo apartado recibido`;
- confirmar que no se borra cliente seleccionado, prenda preparada ni precio en edicion del operador;
- confirmar boton `Actualizar` y `Ultima actualizacion`;
- ocultar/mostrar ventana y confirmar refresh al volver a foco;
- confirmar que `qa.sinpermisos` no hace polling util;
- validar light/dark y mobile/tablet.
