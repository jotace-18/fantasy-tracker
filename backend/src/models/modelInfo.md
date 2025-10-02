# 📘 Modelos de Base de Datos (Backend)

Este documento describe los modelos contenidos en `backend/src/models/`.  
Cada modelo representa una capa de acceso a la base de datos SQLite, encapsulando consultas SQL y operaciones sobre entidades clave del sistema de **Fantasy Football**.

---

## 📂 Estructura de modelos

- [`calendarModel.js`](#calendarmodeljs)
- [`marketModel.js`](#marketmodeljs)
- [`minimalPlayersModel.js`](#minimalplayersmodeljs)
- [`participantPlayersModel.js`](#participantplayersmodeljs)
- [`participantPointsModel.js`](#participantpointsmodeljs)
- [`participantsModel.js`](#participantsmodeljs)
- [`playersModel.js`](#playersmodeljs)
- [`scraperMetadataModel.js`](#scrapermetadatamodeljs)
- [`teamsModel.js`](#teamsmodeljs)
- [`transferModel.js`](#transfermodeljs)

---

## `calendarModel.js`

📅 Gestiona el **calendario de jornadas** y enfrentamientos.

- **Funciones principales**:
  - `getNextJornadas(limit)` → obtiene las próximas jornadas ordenadas por número.
  - `getEnfrentamientosByJornada(jornadaId)` → devuelve los enfrentamientos de una jornada.
  - `updateFechaCierre(jornadaId, nuevaFecha)` → actualiza la fecha de cierre de una jornada.

---

## `marketModel.js`

💰 Representa el **mercado de jugadores disponibles**.

- **Funciones principales**:
  - `getMarket(cb)` → lista jugadores en mercado con datos de puntos y valor de mercado.
  - `add(playerId, cb)` → añade un jugador al mercado.
  - `remove(playerId, cb)` → elimina un jugador específico del mercado.
  - `clearAll(cb)` → vacía por completo la tabla de mercado ⚠️.

---

## `minimalPlayersModel.js`

👤 Contiene una **versión reducida de jugadores**, usada para operaciones rápidas o iniciales.

- **Funciones principales**:
  - `insertMinimalPlayer({ name, slug }, cb)` → inserta un jugador mínimo.
  - `getAllMinimalPlayers(cb)` → obtiene todos los jugadores mínimos.
  - `deleteMinimalPlayer(id, cb)` → elimina un jugador mínimo.

---

## `participantPlayersModel.js`

🧑‍🤝‍🧑 Gestiona la **plantilla de jugadores de un participante**.

- **Funciones principales**:
  - `getTeamByParticipantId(participantId, cb)` → devuelve toda la plantilla de un participante, con stats, cláusulas y estado.
  - `addPlayerToTeam({ participant_id, player_id, status }, cb)` → añade jugador a la plantilla.
  - `updatePlayerStatus(participant_id, player_id, status, slot_index, cb)` → actualiza estado/posición (solo para participant_id = 8).
  - `removePlayerFromTeam(participant_id, player_id, cb)` → elimina jugador de la plantilla.
  - `updateClauseLock(participant_id, player_id, clause_lock_until, cb)` → actualiza fecha de bloqueo de cláusula.
  - `updateClauseValue(participant_id, player_id, clause_value, cb)` → modifica valor de cláusula.
  - `updateClausulable(participant_id, player_id, is_clausulable, cb)` → habilita/deshabilita clausulabilidad.

---

## `participantPointsModel.js`

📊 Maneja los **puntos por jornada de cada participante**.

- **Funciones principales**:
  - `insertPoints({ participant_id, jornada, points }, cb)` → inserta/actualiza puntos.
  - `getPointsByParticipant(participant_id, cb)` → obtiene historial de puntos de un participante.
  - `updatePoints({ participant_id, jornada, points }, cb)` → actualiza puntos en una jornada.
  - `deletePoints({ participant_id, jornada }, cb)` → elimina puntos de una jornada concreta.
  - `deletePointsByJornada(jornada, cb)` → elimina puntos de todos en una jornada.
  - Internamente recalcula `total_points` en la tabla `participants`.

---

## `participantsModel.js`

🙋 Representa a los **usuarios/participantes** en la liga.

- **Funciones principales**:
  - `createParticipant({ name }, cb)` → crea nuevo participante.
  - `getAllParticipants(cb)` → devuelve todos los participantes ordenados por puntos.
  - `getParticipantById(id, cb)` → devuelve participante y su plantilla.
  - `getParticipantMoney(id, cb)` → obtiene saldo de un participante.
  - `updateParticipantMoney(id, money, cb)` → actualiza saldo.
  - `addMoneyToParticipant(id, amount, cb)` → suma dinero al saldo.
  - `updateParticipantPoints(id, total_points, cb)` → actualiza puntos totales.
  - `deleteParticipant(id, cb)` → elimina un participante.
  - `getLeaderboard(cb)` → ranking con historial de puntos por jornada.
  - `updateParticipantFormation(id, formation, cb)` → actualiza formación táctica.

---

## `playersModel.js`

⚽ Gestiona la tabla **players** (jugadores).

- **Funciones principales**:
  - `insertPlayerMinimal({ name, slug, team_id }, cb)` → inserta un jugador básico.
  - `bulkInsertPlayersMinimal(rows, cb)` → inserta varios jugadores en bloque.
  - `getPlayersByTeamId(team_id, cb)` → jugadores de un equipo.
  - `findTopPlayersPaginated(page, limit, sortBy, order)` → ranking de jugadores con paginación y dueño.
  - `findPlayersByTeamSlug(teamSlug)` → jugadores por slug de equipo.
  - `findPlayerById(id)` → jugador detallado (con histórico de mercado y puntos).
  - `searchPlayers({ name, teamId, sort, order, limit, offset })` → búsqueda avanzada con filtros.

---

## `scraperMetadataModel.js`

⏱️ Almacena **metadatos del scraper**, como la última ejecución.

- **Funciones principales**:
  - `getLastScraped(cb)` → obtiene la última fecha de scraping.
  - `updateLastScraped(dateIso, cb)` → actualiza la fecha de última ejecución.

---

## `teamsModel.js`

🏟️ Representa a los **equipos de la liga**.

- **Funciones principales**:
  - `getAllTeams()` → devuelve todos los equipos.
  - `getPlayersByTeam(teamId, sortBy, order)` → jugadores de un equipo ordenados por campo.
  - `addTeam(name)` → inserta un equipo.
  - `addTeamsBulk(names)` → inserta equipos en bloque.
  - `importTeams(teams)` → importa equipos desde un objeto con `names`.

---

## `transferModel.js`

🔄 Gestiona el **historial de transferencias** entre participantes.

- **Funciones principales**:
  - `getAll(cb)` → obtiene todas las transferencias con detalles de jugadores y participantes.
  - `create(transfer, cb)` → crea nueva transferencia (normal o cláusula).
  - `remove(id, cb)` → elimina transferencia por ID.
  - `clearAll(cb)` → borra todo el historial de transferencias ⚠️.

---

## 🔗 Relación entre modelos

- **playersModel** se relaciona con `teamsModel` (cada jugador pertenece a un equipo) y con `participantPlayersModel` (cada jugador puede estar en plantilla de un participante).
- **participantPlayersModel** y **participantPointsModel** dependen de `participantsModel`.
- **marketModel** usa `playersModel` y está vinculado a transferencias.
- **transferModel** conecta `playersModel` con `participantsModel`.
- **calendarModel** organiza las jornadas que influyen en `participantPointsModel`.

---

## 📌 Notas finales

- Todos los modelos encapsulan consultas SQL en **Promesas** o callbacks, para mantener consistencia en controladores.  
- Algunos modelos tienen ⚠️ funciones críticas (`clearAll`, `deletePointsByJornada`, etc.) que eliminan datos masivamente: **usarlas con cuidado**.  
- Se recomienda normalizar el acceso desde **servicios** que combinen varios modelos para mantener separación de responsabilidades.

