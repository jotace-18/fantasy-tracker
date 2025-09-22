
# Documentación Exhaustiva del Frontend — Fantasy Tracker

Este documento describe en profundidad la arquitectura, rutas, páginas, componentes, lógica, flujos de usuario, integración con backend y relaciones internas del frontend de Fantasy Tracker. Está diseñado para que una IA pueda comprender y razonar sobre todo el funcionamiento del frontend.

---

## Índice
- [1. Arquitectura General](#1-arquitectura-general)
- [2. Rutas y Navegación](#2-rutas-y-navegación)
- [3. Páginas y Flujos de Usuario](#3-páginas-y-flujos-de-usuario)
- [4. Componentes Globales y Compartidos](#4-componentes-globales-y-compartidos)
- [5. Integración con Backend](#5-integración-con-backend)
- [6. Ejemplo de Props, Estados y Flujos](#6-ejemplo-de-props-estados-y-flujos)
- [7. Notas de Ampliación y Personalización](#7-notas-de-ampliación-y-personalización)

---

## 1. Arquitectura General

- **Framework:** React 18 + Vite
- **UI:** Chakra UI (componentes y estilos)
- **Routing:** React Router DOM
- **Estado:** Local (useState/useEffect), sin Redux ni Context global
- **Estructura:**
  - `src/main.jsx` — Entry point, ChakraProvider
  - `src/App.jsx` — Monta el router principal
  - `src/routes/AppRouter.jsx` — Define todas las rutas y layout global
  - `src/pages/` — Páginas principales (una por ruta)
  - `src/components/` — Componentes reutilizables (PlayerSearch, layout, etc)
  - `src/components/layout/` — Layout, Sidebar, Topbar

---

## 2. Rutas y Navegación

Definidas en `src/routes/AppRouter.jsx`:

| Ruta                | Página                | Descripción breve                                 |
|---------------------|-----------------------|---------------------------------------------------|
| `/`                 | Dashboard             | Portada, acceso rápido a "Mi Equipo"              |
| `/players`          | PlayersPage           | Ranking de jugadores, paginación, ordenación       |
| `/teams`            | TeamsPage             | Clasificación de equipos, acceso a detalle         |
| `/analysis`         | Analysis              | Página de análisis (placeholder)                   |
| `/teams/:id`        | TeamDetailPage        | Detalle de un equipo y sus jugadores               |
| `/players/:id`      | PlayerDetailPage      | Detalle de un jugador, stats, gráfico, historial   |
| `/my-team`          | MyTeamPage            | Gestión visual e interactiva de tu plantilla       |
| `/leaderboard`      | LeaderboardPage       | Ranking de participantes (usuarios)                |

**Layout global:** Todas las rutas están envueltas en `Layout`, que incluye `Sidebar` y `Topbar`.

---

## 3. Páginas y Flujos de Usuario

### Dashboard (`/`)
- Muestra título y botón para ir a "Mi Equipo".
- No tiene lógica de negocio, solo navegación.

### PlayersPage (`/players`)
- **Lógica:**
  - Fetch a `/api/players/top` con paginación, orden y límite.
  - Permite ordenar por nombre, equipo, valor de mercado, puntos.
  - Renderiza tabla con ranking, nombre (enlace a detalle), equipo, posición, valor, puntos.
  - Paginación con botones y estado local de página.
- **Props/Estado:**
  - `players`, `loading`, `page`, `total`, `sortBy`, `order`
- **Flujo usuario:**
  1. Llega a la página, ve ranking de jugadores.
  2. Puede cambiar de página, ordenar columnas.
  3. Puede hacer click en un jugador para ver su detalle.

### TeamsPage (`/teams`)
- **Lógica:**
  - Fetch a `/api/teams`.
  - Ordena equipos por posición.
  - Renderiza tabla con posición, nombre (enlace a detalle), puntos, partidos, victorias, empates, derrotas, goles a favor/contra, diferencia de goles.
- **Props/Estado:**
  - `teams`, `loading`
- **Flujo usuario:**
  1. Llega a la página, ve clasificación de equipos.
  2. Puede hacer click en un equipo para ver su detalle.

### TeamDetailPage (`/teams/:id`)
- **Lógica:**
  - Fetch a `/api/teams/:id/players` con ordenación.
  - Renderiza tabla de jugadores del equipo, con nombre (enlace a detalle), posición, valor, puntos.
- **Props/Estado:**
  - `players`, `loading`, `sortBy`, `order`
- **Flujo usuario:**
  1. Llega desde TeamsPage, ve jugadores del equipo.
  2. Puede ordenar por nombre, posición, valor, puntos.
  3. Puede ir al detalle de un jugador.

### PlayerDetailPage (`/players/:id`)
- **Lógica:**
  - Fetch a `/api/players/:id`.
  - Renderiza:
    - Cabecera con nombre, equipo, posición, riesgo de lesión.
    - Stats: valor actual, máximo, mínimo, puntos totales y media.
    - Gráfico de evolución de mercado (Recharts, con máximos/mínimos).
    - Tabla de historial de puntos por jornada.
- **Props/Estado:**
  - `player`, `loading`
- **Flujo usuario:**
  1. Llega desde PlayersPage o TeamDetailPage.
  2. Ve detalle completo del jugador, gráfico y stats.

### MyTeamPage (`/my-team`)
- **Lógica:**
  - Permite seleccionar formación (4-4-2, 4-3-3, etc).
  - Renderiza campo de fútbol con slots para cada posición según formación.
  - Permite añadir jugadores mediante modal con búsqueda (`PlayerSearch`).
  - Lista plantilla actual, con distinción entre titulares (XI), banquillo (B) y entrenador.
- **Props/Estado:**
  - `formation`, `myPlayers`, `isOpen` (modal), `orderedPlayers`
- **Flujo usuario:**
  1. Selecciona formación.
  2. Añade jugadores desde modal.
  3. Ve plantilla y puede distinguir titulares/banquillo.

### LeaderboardPage (`/leaderboard`)
- **Lógica:**
  - Fetch a `/api/participants/leaderboard`.
  - Permite seleccionar jornada o ranking total.
  - Renderiza tabla de participantes con puntos, medallas para top 3.
- **Props/Estado:**
  - `participants`, `loading`, `selectedJornada`, `sorted`
- **Flujo usuario:**
  1. Ve ranking de usuarios.
  2. Puede filtrar por jornada o ver ranking total.

### Analysis (`/analysis`)
- Placeholder, solo título.

---

## 4. Componentes Globales y Compartidos

### Layout
- Estructura principal, incluye `Sidebar` y `Topbar`.
- Renderiza children (contenido de la página).
- Prop: `children` (ReactNode)

### Sidebar
- Barra lateral con navegación principal.
- Links: Dashboard, Players, Teams, Analysis, My Team, Leaderboard.
- Resalta la ruta activa.

### Topbar
- Barra superior con botón para lanzar scraper (`/api/scrape`) y avatar de usuario.
- Prop: `onScrape` (callback)

### PlayerSearch
- Componente reutilizable para buscar y seleccionar jugadores.
- Props:
  - `onSelect(player)` — callback al seleccionar jugador
  - `showAddButton` — muestra botón "Añadir"
  - `limit` — máximo de resultados
- Lógica:
  - Filtros por nombre, posición, equipo, orden.
  - Debounce en búsqueda.
  - Llama a `/api/players/search`.

### PlayerSlot (interno de MyTeamPage)
- Renderiza un slot de jugador en el campo o banquillo.
- Props: `role`, `index`, `x`, `y`, `player`, `isBench`

---

## 5. Integración con Backend

- Todas las llamadas a API usan `fetch` a `http://localhost:4000/api/*`.
- Endpoints principales:
  - `/api/players/top`, `/api/players/search`, `/api/players/:id`
  - `/api/teams`, `/api/teams/:id/players`
  - `/api/participants/leaderboard`
  - `/api/scrape` (scraper manual)
- Los datos se consumen en formato JSON.
- No hay autenticación implementada.

---

## 6. Ejemplo de Props, Estados y Flujos

### Ejemplo: PlayerSearch
```jsx
<PlayerSearch onSelect={handleAddPlayer} showAddButton={true} limit={20} />
```
- Estado local: `name`, `position`, `teamId`, `sort`, `order`, `results`, `loading`
- Flujo:
  1. Usuario escribe nombre → actualiza `name` (debounced)
  2. Cambia filtros → actualiza estado y refetch
  3. Click en "Añadir" → llama a `onSelect(player)`

### Ejemplo: MyTeamPage
```jsx
const [formation, setFormation] = useState("4-3-3");
const [myPlayers, setMyPlayers] = useState([]);
```
- Flujo:
  1. Selecciona formación → cambia disposición de slots
  2. Añade jugadores desde modal → se agregan a `myPlayers`
  3. Renderiza plantilla y campo

---

## 7. Notas de Ampliación y Personalización

- El frontend es modular y fácilmente ampliable.
- Se pueden añadir nuevas páginas en `src/pages/` y rutas en `AppRouter.jsx`.
- Los componentes son reutilizables y desacoplados.
- El diseño es responsivo y accesible gracias a Chakra UI.
- No hay lógica de usuario/logueo implementada, pero puede añadirse fácilmente.

---

**Este documento está diseñado para que una IA pueda entender y razonar sobre toda la lógica, flujos, rutas, componentes, props, integración con backend y relaciones entre páginas/componentes del frontend de Fantasy Tracker.**
