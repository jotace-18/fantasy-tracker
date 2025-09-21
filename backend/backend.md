# Documentación del Backend

Este documento describe los endpoints, rutas, controladores y servicios actuales del backend de Fantasy Tracker.

---

## Índice
- [Estructura General](#estructura-general)
- [Endpoints y Rutas](#endpoints-y-rutas)
  - [Jugadores (`/api/players`)](#jugadores-apiplayers)
  - [Equipos (`/api/teams`)](#equipos-apiteams)
  - [Jugadores Mínimos (`/api/minimal-players`)](#jugadores-mínimos-apiminimal-players)
  - [Scraper (`/api/scrape`)](#scraper-apiscrape)
- [Controladores](#controladores)
- [Servicios](#servicios)

---

## Estructura General

- El backend está construido con Express.js.
- El punto de entrada es `src/index.js`.
- Usa rutas para jugadores, equipos, jugadores mínimos y scraping.
- El puerto por defecto es el 4000.

---

## Endpoints y Rutas

### Jugadores (`/api/players`)

- `POST /api/players/minimal` — Alta mínima de un jugador (nombre + equipo [+ slug opcional])
- `POST /api/players/minimal/bulk` — Alta masiva mínima por equipo (lista de nombres)
- `GET /api/players/team/:teamId` — Listar jugadores por equipo (por ID)
- `PUT /api/players/:id/team` — Actualizar el equipo de un jugador
- `GET /api/players/top` — Listar jugadores top (paginado, ordenado)
- `GET /api/players/teams/:slug/players` — Listar jugadores por slug de equipo
- `GET /api/players/:id` — Obtener detalle de un jugador

### Equipos (`/api/teams`)

- `GET /api/teams` — Listar todos los equipos
- `GET /api/teams/:id/players` — Listar jugadores de un equipo (por ID)

### Jugadores Mínimos (`/api/minimal-players`)

- `POST /api/minimal-players` — Añadir jugador mínimo
- `GET /api/minimal-players` — Listar todos los jugadores mínimos
- `DELETE /api/minimal-players/:id` — Eliminar jugador mínimo

### Scraper (`/api/scrape`)

- `GET /api/scrape` — Ejecuta el scraper de jugadores mínimos

---

## Controladores

### playersController.js
- `addPlayerMinimal` — Añade un jugador mínimo usando playersService.
- `addPlayersBulk` — Añade varios jugadores mínimos a un equipo.
- `listPlayersByTeam` — Lista jugadores por ID de equipo.
- `getTopPlayers` — Devuelve jugadores top paginados y ordenados.
- `getPlayersByTeamSlug` — Devuelve jugadores por slug de equipo.
- `getPlayerById` — Devuelve detalle de un jugador por ID.

### teamsController.js
- `getAllTeams` — Devuelve todos los equipos.
- `getPlayersByTeam` — Devuelve jugadores de un equipo (ID).
- `addTeam` — Añade un equipo nuevo.
- `addTeamsBulk` — Añade varios equipos (bulk).

### minimalPlayersController.js
- `add` — Añade un jugador mínimo.
- `list` — Lista todos los jugadores mínimos.
- `remove` — Elimina un jugador mínimo por ID.

---

## Servicios

### playersService.js
- `addPlayerName` — Añade un jugador mínimo, creando el equipo si no existe.
- `addPlayerNamesBulk` — Añade varios jugadores mínimos a un equipo.
- `listPlayersByTeam` — Lista jugadores por ID de equipo.
- `fetchTopPlayersPaginated` — Devuelve jugadores top paginados y ordenados.
- `fetchPlayersByTeamSlug` — Devuelve jugadores por slug de equipo.
- `fetchPlayerById` — Devuelve detalle de un jugador por ID.

### teamsService.js
- `fetchAllTeams` — Devuelve todos los equipos.
- `fetchPlayersByTeam` — Devuelve jugadores de un equipo (ID).
- `createTeam` — Añade un equipo nuevo.
- `createTeamsBulk` — Añade varios equipos (bulk).
- `importTeams` — Importa equipos.

### minimalPlayersService.js
- `addMinimalPlayer` — Añade un jugador mínimo.
- `listMinimalPlayers` — Lista todos los jugadores mínimos.
- `removeMinimalPlayer` — Elimina un jugador mínimo por ID.

### scraperService.js
- `scrapeAllMinimalPlayers` — Ejecuta el scraping de jugadores mínimos.

---

## Notas
- Todos los endpoints devuelven respuestas en formato JSON.
- Los controladores gestionan la lógica HTTP y delegan la lógica de negocio a los servicios.
- Los servicios interactúan con los modelos y la base de datos.
