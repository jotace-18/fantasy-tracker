
# Documentación exhaustiva del Backend de Fantasy Tracker

Este documento describe en profundidad la arquitectura, entidades, endpoints, flujos y lógica del backend del proyecto Fantasy Tracker.

---

## Índice
- [Estructura General](#estructura-general)
- [Entidades y Relaciones](#entidades-y-relaciones)
- [Endpoints y Rutas](#endpoints-y-rutas)
  - [Jugadores (`/api/players`)](#jugadores-apiplayers)
  - [Equipos (`/api/teams`)](#equipos-apiteams)
  - [Usuarios y Equipos de Usuario (`/api/user`)](#usuarios-y-equipos-de-usuario-apiuser)
  - [Participantes y Ligas (`/api/participants`)](#participantes-y-ligas-apiparticipants)
  - [Puntos de Participante (`/api/participant-points`)](#puntos-de-participante-apiparticipant-points)
  - [Transferencias (`/api/transfers`)](#transferencias-apitransfers)
  - [Jugadores Mínimos (`/api/minimal-players`)](#jugadores-mínimos-apiminimal-players)
  - [Scraper (`/api/scrape`)](#scraper-apiscrape)
- [Controladores y Servicios](#controladores-y-servicios)
- [Flujos de Usuario y Lógica](#flujos-de-usuario-y-lógica)
- [Ejemplos de Payloads y Respuestas](#ejemplos-de-payloads-y-respuestas)
- [Notas y Consejos de Integración](#notas-y-consejos-de-integración)

---

## Estructura General

- Backend en Node.js con Express.
- Base de datos SQLite (db/fantasy.sqlite).
- Arquitectura modular: rutas, controladores, servicios, modelos.
- El punto de entrada es `src/index.js`.
- El puerto por defecto es el 4000.

---

## Entidades y Relaciones

### Jugador (`players`)
- id, name, position, team_id, market_value, ...
- Relación N:1 con Equipo (`teams`)

### Equipo (`teams`)
- id, name, slug, ...
- Relación 1:N con Jugadores

### Usuario/Equipo de Usuario (`user_teams`)
- id, name, money, is_self
- Relación N:M con Jugadores (tabla `user_players`)
- Relación 1:N con Puntos (`user_points`)

### Participante (`participants`)
- id, name, liga, ...
- Relación N:M con Jugadores (tabla `participant_players`)
- Relación 1:N con Puntos (`participant_points`)

### Transferencia (`transfers`)
- id, player_id, from_team, to_team, price, date

### Puntos (`user_points`, `participant_points`)
- id, user_team_id/participant_id, jornada, points

---

## Endpoints y Rutas

### Jugadores (`/api/players`)

- `GET /api/players/top` — Lista jugadores top (paginado, ordenado)
- `GET /api/players/:id` — Detalle de un jugador
- `GET /api/players/team/:teamId` — Jugadores por equipo
- `GET /api/players/teams/:slug/players` — Jugadores por slug de equipo
- `POST /api/players/minimal` — Alta mínima de jugador
- `POST /api/players/minimal/bulk` — Alta masiva mínima
- `PUT /api/players/:id/team` — Cambiar equipo de un jugador
- `GET /api/players/search?...` — Búsqueda avanzada (por nombre, posición, equipo, orden, etc.)

#### Ejemplo de respuesta de búsqueda:
```json
[
  { "id": 1, "name": "Vinicius Jr.", "position": "FWD", "team_id": 3, "market_value": 18000000 }
]
```

### Equipos (`/api/teams`)
- `GET /api/teams` — Listar todos los equipos
- `GET /api/teams/:id/players` — Jugadores de un equipo

### Usuarios y Equipos de Usuario (`/api/user`)
- `POST /api/user/teams` — Crear equipo de usuario
- `GET /api/user/teams` — Listar equipos de usuario
- `GET /api/user/teams/:id` — Detalle de equipo de usuario (incluye jugadores y puntos)
- `PUT /api/user/teams/:id/money` — Actualizar dinero del equipo
- `POST /api/user/teams/:id/players` — Añadir jugador a equipo
- `DELETE /api/user/teams/:id/players/:playerId` — Quitar jugador
- `POST /api/user/teams/:id/points` — Añadir puntos a equipo
- `GET /api/user/leaderboard` — Ranking de equipos de usuario

#### Ejemplo de creación de equipo:
```json
{
  "name": "Mi Equipo",
  "money": 50000000,
  "is_self": 1
}
```

#### Ejemplo de respuesta de detalle de equipo:
```json
{
  "id": 1,
  "name": "Mi Equipo",
  "money": 50000000,
  "players": [ { "id": 1, "name": "Vinicius Jr.", ... } ],
  "points": [ { "jornada": 1, "points": 50 }, ... ]
}
```

### Participantes y Ligas (`/api/participants`)
- `POST /api/participants` — Crear participante
- `GET /api/participants` — Listar participantes
- `PUT /api/participants/:id/points` — Actualizar puntos
- `DELETE /api/participants/:id` — Eliminar participante
- `GET /api/participants/leaderboard` — Ranking de participantes

### Puntos de Participante (`/api/participant-points`)
- `POST /api/participant-points` — Añadir puntos
- `GET /api/participant-points/:participantId` — Listar puntos
- `PUT /api/participant-points` — Actualizar puntos
- `DELETE /api/participant-points` — Eliminar puntos

### Transferencias (`/api/transfers`)
- `GET /api/transfers/player/:playerId` — Historial de transferencias de un jugador
- `POST /api/transfers/buy` — Comprar jugador
- `POST /api/transfers/sell` — Vender jugador
- `POST /api/transfers/clause` — Ejecutar cláusula

### Jugadores Mínimos (`/api/minimal-players`)
- `POST /api/minimal-players` — Añadir jugador mínimo
- `GET /api/minimal-players` — Listar todos los jugadores mínimos
- `DELETE /api/minimal-players/:id` — Eliminar jugador mínimo

### Scraper (`/api/scrape`)
- `GET /api/scrape` — Ejecuta el scraper de jugadores mínimos

---

## Controladores y Servicios

Cada endpoint tiene asociado un controlador y un servicio. Los controladores gestionan la lógica HTTP y validación, los servicios la lógica de negocio y acceso a modelos/DB.

Ejemplo: `/api/user/teams` → userController → userService → userModel, userPlayerModel, userPointsModel

---

## Flujos de Usuario y Lógica

### Crear equipo de usuario
1. POST `/api/user/teams` con nombre y dinero inicial.
2. El equipo se almacena en `user_teams`.
3. Se pueden añadir jugadores con POST `/api/user/teams/:id/players`.
4. Los jugadores se almacenan en `user_players`.
5. Se pueden añadir puntos por jornada con POST `/api/user/teams/:id/points`.
6. El ranking se consulta con GET `/api/user/leaderboard`.

### Participantes y ligas
1. POST `/api/participants` para crear participante.
2. Añadir jugadores a participante (tabla `participant_players`).
3. Añadir puntos por jornada (tabla `participant_points`).
4. Ranking de participantes con GET `/api/participants/leaderboard`.

### Transferencias
1. POST `/api/transfers/buy` para comprar jugador.
2. POST `/api/transfers/sell` para vender jugador.
3. POST `/api/transfers/clause` para ejecutar cláusula de rescisión.
4. GET `/api/transfers/player/:playerId` para ver historial de transferencias.

---

## Ejemplos de Payloads y Respuestas

### Crear equipo de usuario
**POST** `/api/user/teams`
```json
{
  "name": "Mi Equipo",
  "money": 50000000,
  "is_self": 1
}
```
**Respuesta:**
```json
{ "id": 1 }
```

### Añadir jugador a equipo
**POST** `/api/user/teams/1/players`
```json
{
  "player_id": 5,
  "buy_price": 12000000,
  "buy_date": "2025-09-22"
}
```

### Respuesta de detalle de equipo
**GET** `/api/user/teams/1`
```json
{
  "id": 1,
  "name": "Mi Equipo",
  "money": 50000000,
  "players": [
    { "id": 5, "name": "Bellingham", "position": "MID", ... }
  ],
  "points": [
    { "jornada": 1, "points": 50 },
    { "jornada": 2, "points": 42 }
  ]
}
```

---

## Notas y Consejos de Integración

- Todos los endpoints devuelven JSON.
- El backend está preparado para multiusuario y ligas.
- Los modelos y servicios pueden ampliarse fácilmente para nuevas reglas o entidades.
- El scraping permite poblar la base de datos con datos reales de jugadores y equipos.
- El sistema de transferencias y puntos es flexible y permite simulaciones de ligas fantasy.
