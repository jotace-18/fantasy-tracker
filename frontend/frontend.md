# Documentación del Frontend

Este documento describe la estructura, rutas, páginas y componentes principales del frontend de Fantasy Tracker.

---

## Índice
- [Estructura General](#estructura-general)
- [Rutas y Navegación](#rutas-y-navegación)
- [Páginas](#páginas)
- [Componentes Principales](#componentes-principales)

---

## Estructura General

- El frontend está construido con React y Vite.
- Usa Chakra UI para el diseño y componentes visuales.
- El punto de entrada es `src/main.jsx`.
- La navegación se gestiona con React Router (`AppRouter.jsx`).

---

## Rutas y Navegación

Las rutas principales están definidas en `src/routes/AppRouter.jsx`:

- `/` — Dashboard
- `/players` — Listado de jugadores
- `/teams` — Listado de equipos
- `/analysis` — Página de análisis
- `/teams/:id` — Detalle de equipo
- `/players/:id` — Detalle de jugador

Todas las rutas están envueltas en el componente `Layout`, que incluye la barra lateral y la barra superior.

---

## Páginas

### Dashboard (`/`)
- Muestra el título "Dashboard".

### PlayersPage (`/players`)
- Lista los jugadores top, paginados y ordenados.
- Permite cambiar de página y ordenar por diferentes campos.
- Cada jugador enlaza a su detalle.

### TeamsPage (`/teams`)
- Muestra la clasificación de equipos de LaLiga.
- Permite ver detalles de cada equipo.

### Analysis (`/analysis`)
- Página de análisis (título).

### TeamDetailPage (`/teams/:id`)
- Muestra los jugadores de un equipo concreto.
- Permite ordenar por diferentes estadísticas.

### PlayerDetailPage (`/players/:id`)
- Muestra el detalle de un jugador, incluyendo:
  - Estadísticas generales
  - Historial de mercado (gráfico)
  - Datos de equipo y posición

---

## Componentes Principales

### Layout
- Estructura principal de la app.
- Incluye Sidebar y Topbar.
- Renderiza el contenido de la página seleccionada.

### Sidebar
- Barra lateral con enlaces a las páginas principales.
- Muestra el nombre de la app y navegación.

### Topbar
- Barra superior con botón para lanzar el scraper (actualizar datos) y avatar de usuario.

---

## Notas
- Todas las peticiones a la API se hacen a `http://localhost:4000`.
- El diseño es responsivo y usa Chakra UI.
- El frontend está preparado para ampliarse con nuevas páginas o componentes.
