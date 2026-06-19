# LIVE-HOLD-UX-FAST-7 - Seccion de apartado compacta

## Resumen ejecutivo

Se compacto la seccion `4. APARTADO` de LIVE para reducir texto fijo, acercar el boton `APARTAR AHORA` y mantener el flujo operativo sin romper apartados con cliente formal ni con alias/interesado.

## Problema visual corregido

La seccion tenia varias lineas permanentes antes del boton:

- ayuda larga para confirmar precio y registrar apartado;
- recordatorio fijo para confirmar telefono o nombre;
- validaciones contextuales.

Esto hacia que la pantalla se sintiera pesada, especialmente en mobile.

## Texto eliminado

Dentro del paso `4. APARTADO` se elimino la ayuda fija redundante:

```text
Confirma telefono o nombre antes de apartar. Si hay duda, registra como interesado.
```

Esa instruccion ya esta cubierta por la seccion de cliente/interesado y por las validaciones contextuales.

## Texto final

El texto permanente queda reducido a:

```text
Confirma el precio y registra el apartado.
```

En ingles:

```text
Confirm the price and create the hold.
```

## Validaciones que siguen existiendo

Se conservaron:

- validacion de prenda al aire;
- validacion de cliente formal o alias/interesado;
- validacion de alias minimo/maximo;
- validacion de prenda ya apartada;
- loading y prevencion de doble clic;
- aviso compacto de prenda ya apartada;
- mensajes de error contextuales.

## No se toco

- Backend;
- migraciones;
- Android/EAS;
- login/Auth;
- /reservations;
- reglas funcionales de apartados;
- flujo de alias/interesado;
- polling.

## Validaciones

Validaciones requeridas:

- npm run lint;
- npx tsc --noEmit;
- git --no-pager diff --check.

No aplica `mvnw test` porque no se toco backend.

## Smoke visual recomendado

1. Abrir LIVE.
2. Revisar `4. APARTADO`.
3. Confirmar que solo queda una ayuda breve.
4. Confirmar que `APARTAR AHORA` queda mas visible.
5. Probar apartado con cliente formal.
6. Probar apartado con alias/interesado.
7. Intentar apartar sin cliente ni alias y confirmar mensaje contextual.
8. Confirmar que prenda ya apartada conserva aviso compacto.
9. Confirmar que no hay polling automatico.

## Resultado

GO_TECNICO si lint, typecheck y diff check pasan.
