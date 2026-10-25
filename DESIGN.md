---
name: ReportaJalapa
description: App cívica oscura, sobria y tranquila para reportar problemas de la comunidad de Jalapa.
colors:
  fondo-pizarra: "#0E141B"
  superficie: "#151D26"
  elevada: "#1C2630"
  borde: "#263340"
  borde-fuerte: "#34455A"
  texto: "#E6EDF4"
  texto-secundario: "#9CABBB"
  texto-tenue: "#7C8D9F"
  acento-hielo: "#7FA7C9"
  sobre-acento: "#0B1218"
  estado-pendiente: "#E58F98"
  estado-en-proceso: "#DDB26A"
  estado-resuelto: "#93BBA0"
  prioridad-reciente: "#8DA2B8"
typography:
  titulo:
    fontFamily: "system-ui (SF en iOS, Roboto en Android; en web -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto)"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "-0.7px"
  titulo-medio:
    fontFamily: "system-ui"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.35px"
  subtitulo:
    fontFamily: "system-ui"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "23px"
  cuerpo:
    fontFamily: "system-ui"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "23px"
  pequeno:
    fontFamily: "system-ui"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  etiqueta:
    fontFamily: "system-ui"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.7px"
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  pildora: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  xxxl: "32px"
components:
  boton-primario:
    backgroundColor: "{colors.acento-hielo}"
    textColor: "{colors.sobre-acento}"
    rounded: "{rounded.lg}"
    height: "48px"
    padding: "0 20px"
  boton-secundario:
    backgroundColor: "{colors.elevada}"
    textColor: "{colors.texto}"
    rounded: "{rounded.lg}"
    height: "48px"
  campo:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    rounded: "{rounded.lg}"
    height: "52px"
    padding: "0 16px"
  tarjeta-reporte:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.xl}"
  barra-pestanas:
    backgroundColor: "{colors.elevada}"
    rounded: "{rounded.pildora}"
    height: "72px"
  mosaico:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.lg}"
---

# Design System: ReportaJalapa

## Overview

**Creative North Star: "La oficina de atención a la hora azul"**

Una app cívica de interfaz oscura, tranquila y confiable: pizarra azulada, superficies que suben un escalón de luz, bordes de 1 px y mucho espacio libre. Se inspira en la calma de las apps nativas de iOS sin copiar ninguna. Nada llamativo ni saturado: el color con significado (estados) es apagado y el acento azul hielo se usa con moderación.

La misma experiencia vale en teléfono y en navegador; en web el contenido se centra en una columna cómoda.

**Key Characteristics:**
- Tema oscuro frío como base; superficies por tonos, no por sombras fuertes.
- Tarjetas muy redondeadas (18 a 22 px) con borde fino.
- Íconos de línea (Ionicons *outline*) con un solo trazo en toda la app.
- Estados como píldoras translúcidas con punto de color.
- Movimiento sutil: 200 a 350 ms, salida suave, sin rebotes.

## Colors

Paleta fría y apagada con un solo acento.

- **Fondo pizarra** (`#0E141B`): fondo de pantalla.
- **Superficie** (`#151D26`) y **Elevada** (`#1C2630`): tarjetas y elementos elevados (barra de pestañas, hojas, avisos). **Borde** (`#263340`) y **Borde fuerte** (`#34455A`).
- **Texto** casi blanco azulado (`#E6EDF4`); secundario `#9CABBB` (6,9:1 sobre superficie) y tenue `#7C8D9F` (4,8:1).
- **Acento hielo** (`#7FA7C9`): botón principal, pestaña activa, enlaces. El texto sobre él es `#0B1218` (7,5:1).
- **Estados desaturados:** pendiente coral `#E58F98`, en proceso ámbar `#DDB26A`, resuelto salvia `#93BBA0`. Se usan como punto o etiqueta con fondo translúcido (14 a 16 % de opacidad), nunca como bloque sólido.

## Typography

Fuente del sistema, sin fuentes externas. La jerarquía se logra con tamaño y peso: título grande 30 px semibold con interletraje levemente negativo, subtítulos 17 px semibold, cuerpo 16 px regular y etiquetas pequeñas en mayúsculas o gris tenue. Escala definida en `src/theme.ts`.

## Layout

Escala de espaciado de 4 px. Contenido con 20 px de margen lateral. Áreas táctiles de al menos 44 px. En web la columna tiene un máximo de 880 px, los formularios 640 px y el login 420 px; la lista pasa a dos columnas desde 900 px de ancho. La barra de pestañas flota sobre el contenido, así que cada pantalla reserva 124 px abajo.

## Elevation & Depth

Capas tonales (fondo, superficie, elevada) más sombras casi imperceptibles (`0 4px 14px` a 22 % de negro en tarjetas; `0 10px 28px` a 38 % en la barra, la hoja del mapa y los avisos). Sin sombras duras ni halos de color.

## Shapes

Radios de 10, 14, 18 y 22 px; píldora para etiquetas, filtros y la barra de pestañas. Bordes de 1 px. Los círculos suaves (medallones) alojan los íconos de categoría y de paso.

## Components

- **Botón:** 48 px de alto, primario en acento hielo, secundario elevado con borde, fantasma solo con texto de acento. Al presionar se reduce a 0,97 y se atenúa.
- **Campo:** 52 px, borde fino que pasa a acento al enfocarse y a coral si hay error; etiqueta pequeña en mayúsculas encima.
- **Tarjeta de reporte:** foto, medallón de categoría, título, tiempo transcurrido, píldora de estado, descripción, respuesta de la municipalidad y acciones en píldora.
- **Mosaico de categoría:** ícono y nombre; seleccionado con borde y fondo de acento suave.
- **Barra de pestañas flotante:** píldora elevada con un círculo de acento que se desliza hasta la pestaña activa.
- **Hoja del mapa:** la tarjeta del reporte sube con desvanecimiento y 32 px de desplazamiento.
- **Aviso (toast), esqueletos y confirmación de envío:** desvanecimientos discretos; se respeta "reducir movimiento".

## Brand mark

La marca es un pin de ubicación con una J dentro (`src/components/MarcaJ.tsx`): contorno en acento hielo, relleno translúcido y J en el color de texto. En el login se anima: el trazo se dibuja, aparece la J, el pin flota 3 px y una onda se expande en el suelo. En la barra lateral y el encabezado es un dibujo fijo. Debajo del título del login, una fila con las nueve categorías ilumina una a una (`CategoriasRotativas`).

## Do's and Don'ts

**Hacer**
- Tomar todos los valores de `src/theme.ts`.
- Usar los componentes de `src/components/ui.tsx` y `motion.tsx`.
- Mantener contraste de texto de 4,5:1 como mínimo.

**Evitar**
- Colores de estado saturados o bloques sólidos de color.
- Rebotes, resortes y movimientos grandes.
- Bordes de color de más de 1 px en un solo lado, texto con degradado y sombras duras.
- Fuentes externas y librerías de animación.
- Emojis o glifos como íconos.
