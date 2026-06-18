# ERP LIVE - Simulacion runtime

Fecha: 2026-05-19  
Fase: LIVE-P - runtime realistic flow

## Objetivo

Preparar la experiencia visual para que `En vivo` se perciba en movimiento aunque todavia no exista backend realtime.

## Elementos simulados

- Espectadores actuales.
- Reservas recientes.
- Comentarios.
- Reacciones.
- Personas viendo el producto.
- Producto popular.
- Ultimas piezas.

## Activity feed

El feed usa mensajes humanos:

- Cliente reservo producto.
- Cliente pregunto por talla.
- Audiencia esta viendo el producto.
- Producto quedo destacado.

Cada evento muestra:

- badge,
- texto breve,
- timestamp compacto,
- jerarquia visual.

## Preparacion futura

Cuando exista backend realtime, el frontend deberia poder cambiar el origen de datos del feed desde:

- eventos simulados,
- eventos internos LIVE,
- adaptadores de plataformas externas,
- agregador de metricas LIVE.

## Reglas

- No convertir errores reales en datos simulados.
- No mezclar metricas demo con datos financieros.
- No presentar la simulacion como integracion real.
- Mantener `company_id` obligatorio cuando se implemente persistencia.

## QA pendiente

- Smoke visual mobile/tablet/desktop.
- Prueba tactil en Galaxy Tab/iPad.
- Validacion de lectura rapida con operador.
