# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users
Vecinos de Jalapa (Guatemala) que reportan problemas de su comunidad desde el teléfono o el navegador: foto, categoría, descripción, ubicación y, opcionalmente, indicaciones y teléfono. Personal de la municipalidad que ve todos los reportes, cambia su estado y responde al vecino. Los vecinos solo ven sus propios reportes.

## Product Purpose
Canal ordenado entre la comunidad y la municipalidad: el vecino reporta con evidencia y ubicación, la municipalidad prioriza, atiende y responde. Éxito: reportes claros, atendidos y cerrados con respuesta visible.

## Capabilities and Constraints
- Expo SDK 58 / React Native 0.88 / Supabase (Auth, Postgres con RLS, Storage). Una sola base de código para iOS, Android y web (react-native-web).
- Categorías: Baches, Basura, Alumbrado, Fugas de agua, Drenaje tapado, Árbol caído, Animales, Inseguridad, Otro (con título propio).
- Estados: pendiente, en proceso, resuelto. Prioridad (alta, media, reciente) para la municipalidad.
- Máximo 5 reportes por día por cuenta; foto jpeg/png de hasta 5 MB; descripción de 10 a 300 caracteres; teléfono de 8 dígitos visible solo para la municipalidad.
- Zona de Jalapa definida; fuera de ella se acepta pero se marca "fuera de Jalapa".
- Pestañas: Reportes, Resueltos, Mapa, Nuevo (solo vecinos). Sin Expo Router: navegación por estado en App.tsx.
- Sin librerías nuevas de animación ni fuentes externas (restricción del usuario).

## Brand Commitments
Nombre: ReportaJalapa. Tono sobrio, tranquilo, cívico. Idioma: español de Guatemala.

## Evidence on Hand
No hay logotipo ni testimonios; assets Expo por defecto en `assets/`. No inventar métricas ni claims.

## Product Principles
- La evidencia (foto y lugar) es el centro de cada reporte.
- Un reporte siempre muestra su estado y la respuesta de la municipalidad.
- Reportar debe tomar pocos pasos y tolerar GPS impreciso.
- La misma experiencia en teléfono y en navegador.

## Accessibility & Inclusion
Contraste mínimo 4.5:1, áreas táctiles de 44 px o más, respeto a "reducir movimiento".

<!-- Inferido del código y de las respuestas del usuario (plataforma adaptive; usuarios confirmados). -->
