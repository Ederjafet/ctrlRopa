# ERP LIVE - UX de captura de prenda

Fecha: 2026-05-20  
Fase: LIVE-W

## Problema

El bloque de prenda mostraba input y cuatro botones con peso visual similar. QA detecto confusion entre escanear, escribir codigo, buscar y crear prenda.

## Solucion

Se crea flujo guiado:

- Input principal: `Codigo o QR de la prenda`.
- CTA primario: `Agregar prenda`.
- Ayuda: `Usa codigo o QR si la prenda ya existe.`
- Bloque secundario: `¿No tienes codigo?`
- Acciones secundarias: buscar prenda y escanear QR.
- Accion terciaria: crear prenda rapida.

## Criterio UX

Crear prenda no debe competir con agregar una prenda existente. En operacion LIVE, la ruta rapida debe favorecer codigo/QR y busqueda.
