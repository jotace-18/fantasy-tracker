# API & Scraper Reference

Documento maestro de endpoints REST y del flujo de scraping. Todas las rutas sirven JSON. Prefijo base backend: `http://localhost:4000/api` (por defecto).

---
## Convenciones
- Respuestas de error: `{ error: string }` y status apropiado (400 validación, 404 no encontrado, 500 interno).
- Paginación (cuando aplica): parámetros `page` (>=1), `limit` (>0). Respuesta estándar: `{ data: [], page, limit, total }`.
- Ordenación: `sort` + `order` (ASC|DESC). Campos específicos según recurso.
- Cache puntual: Detalle de jugador cacheado 60s salvo `?noCache=1`.

---
## Endpoints

### Players `/players`
| Método | Path | Descripción | Query / Body | Respuesta | Notas |
|--------|------|-------------|--------------|-----------|-------|
| POST | /players/minimal | Alta mínima jugador | `{ name, teamName, slug? }` | `{ id, name, slug }` | Genera slug si falta |
| POST | /players/minimal/bulk | Alta masiva mínima | `{ teamName, names: string[] }` | `{ inserted, errors[] }` | Idempotencia parcial |
| GET | /players/team/:teamId | Lista por teamId | `sort?, order?` | `[ { ...player } ]` | Orden delegada a model |
| PUT | /players/:id/team | Cambia team_id (legacy inline) | `{ team_id }` | `{ success: true, player_id, team_id }` | Migrable a controlador |
| GET | /players/top | Ranking top | `page?, limit?, sort?, order?` | `{ data, page, limit, total }` | Paginado |
| GET | /players/teams/:slug/players | Por slug de equipo | `sort?, order?` | `[ { ...player } ]` | Usa slug normalizado |
| GET | /players/search | Búsqueda | `name?, teamId?, sort?, order?, page?, limit?` | `{ data, page, limit, total }` | Shape uniforme |
| GET | /players/:id | Detalle | `noCache=1?` | `{ id, name, team, ... }` | Cache TTL 60s |

### Teams `/teams`
| Método | Path | Descripción | Query | Respuesta |
|--------|------|-------------|-------|-----------|
| GET | /teams | Todos los equipos | — | `[ { id, name, slug } ]` |
| GET | /teams/:id/players | Jugadores del equipo | `sort?, order?` | `[ { ...player } ]` |

### Participants `/participants`
| Método | Path | Descripción | Body/Query | Respuesta | Notas |
|--------|------|-------------|-----------|----------|-------|
| POST | /participants | Crear participante | `{ name, money? }` | `{ id, ... }` | money default si no provisto |
| GET | /participants | Listar | — | `[ { id, name, money, total_points } ]` | |
| GET | /participants/leaderboard | Ranking | `jornada?` | `[ { id, name, total_points, jornada_points? } ]` | Filtro opcional jornada |
| GET | /participants/:id | Detalle | — | `{ id, name, formation?, money, total_points }` | |
| PUT | /participants/:id/points | Ajuste total | `{ total_points }` | `{ updated: true }` | Uso moderado |
| DELETE | /participants/:id | Borrado | — | `{ deleted: true }` | |
| GET | /participants/:id/money | Consultar saldo | — | `{ money }` | |
| PUT | /participants/:id/money | Set absoluto | `{ money }` | `{ money }` | Sobrescribe |
| POST | /participants/:id/add-money | Incremento | `{ amount }` | `{ money }` | Delta positivo/negativo |
| PUT | /participants/:id/formation | Cambia formación | `{ formation }` | `{ id, formation }` | Validar formato (ej 4-4-2) |

### Participant Players `/participant-players`
| Método | Path | Descripción | Body | Respuesta |
|--------|------|-------------|------|----------|
| GET | /participant-players/:id/team | Roster participante | — | `[ { player_id, status, clause_value, clausulable, clause_lock_at? } ]` |
| POST | /participant-players/:id/team | Añadir jugador | `{ player_id }` | `{ inserted: true }` |
| PUT | /participant-players/:id/team/:playerId | Cambiar status | `{ status }` | `{ status }` |
| PATCH | /participant-players/:id/team/:playerId/clause | Actualizar valor cláusula | `{ clause_value }` | `{ clause_value }` |
| PATCH | /participant-players/:id/team/:playerId/clausulable | Toggle clausulable | `{ clausulable }` | `{ clausulable }` |
| PATCH | /participant-players/:id/team/:playerId/clause-lock | Bloquear/desbloquear | `{ locked: boolean }` | `{ clause_lock_at }` |
| DELETE | /participant-players/:id/team/:playerId | Eliminar del roster | — | `{ removed: true }` |

### Participant Points `/participant-points`
| Método | Path | Descripción | Body | Respuesta |
|--------|------|-------------|------|----------|
| POST | /participant-points | Crear registro puntos | `{ participant_id, jornada, points }` | `{ id, participant_id, jornada, points }` |
| GET | /participant-points/:participantId | Histórico | — | `[ { jornada, points } ]` |
| PUT | /participant-points | Update puntual | `{ participant_id, jornada, points }` | `{ updated: true }` |
| DELETE | /participant-points | Borrar puntual | `{ participant_id, jornada }` | `{ deleted: true }` |
| DELETE | /participant-points/jornada/:jornada | Borrar jornada completa | — | `{ deleted: n }` |

### Market `/market`
| Método | Path | Descripción | Body | Respuesta |
|--------|------|-------------|------|----------|
| GET | /market | Listar jugadores en mercado | — | `[ { player_id, ... } ]` |
| POST | /market | Añadir jugador | `{ player_id }` | `{ inserted: true }` |
| DELETE | /market/:playerId | Quitar jugador | — | `{ removed: true }` |
| DELETE | /market | Vaciar mercado | — | `{ cleared: true }` |

### Transfers `/transfers`
| Método | Path | Descripción | Body | Respuesta | Notas |
|--------|------|-------------|------|----------|-------|
| GET | /transfers | Histórico | — | `[ { id, player_id, type, amount, from_participant_id?, to_participant_id? } ]` | Falta filtro futuro |
| POST | /transfers | Crear transferencia | `{ player_id, type, amount, from_participant_id?, to_participant_id? }` | `{ id, ... }` | type ej: BUY/SELL/CLAUSE |
| DELETE | /transfers/:id | Borrar puntual | — | `{ deleted: true }` | |
| DELETE | /transfers | Limpiar todas | — | `{ cleared: true }` | |

### Minimal Players `/minimal-players`
| Método | Path | Descripción | Body | Respuesta |
|--------|------|-------------|------|----------|
| POST | /minimal-players | Alta mínima | `{ name }` | `{ id, name, slug }` |
| GET | /minimal-players | Listar | — | `[ { id, name, slug, team } ]` |
| DELETE | /minimal-players/:id | Eliminar | — | `{ deleted: true }` |

### Calendar `/calendar`
| Método | Path | Descripción | Body | Respuesta |
|--------|------|-------------|------|----------|
| GET | /calendar/next | Próximas jornadas + partidos | — | `[ { jornada, fecha_cierre, matches: [] } ]` |
| PUT | /calendar/:jornadaId/fecha-cierre | Actualiza fecha cierre | `{ fecha_cierre }` | `{ updated: true }` |

### Match Results `/match-results`
| Método | Path | Descripción | Body | Respuesta |
|--------|------|-------------|------|----------|
| POST | /match-results | Crear resultado | `{ jornada, local_team_id, away_team_id, local_goals, away_goals }` | `{ id, ... }` |
| GET | /match-results/jornada/:jornadaId | Listar jornada | — | `[ { ... } ]` |
| GET | /match-results/:id | Detalle | — | `{ id, ... }` |
| PUT | /match-results/:id | Actualizar | `{ ...campos }` | `{ updated: true }` |
| DELETE | /match-results/:id | Eliminar | — | `{ deleted: true }` |

### Clock `/clock`
| Método | Path | Descripción | Body | Respuesta |
|--------|------|-------------|------|----------|
| GET | /clock | Hora simulada | — | `{ currentTime }` |
| POST | /clock/advance | Avanzar minutos | `{ minutes }` | `{ currentTime }` |
| POST | /clock/set | Fijar hora | `{ date }` | `{ currentTime }` |

### Scraper Metadata `/scraper-metadata`
| Método | Path | Descripción | Respuesta |
|--------|------|-------------|-----------|
| GET | /scraper-metadata/last | Último timestamp scraping | `{ lastScrapedAt, ... }` |

### Scraper Manual `/scrape`
| Método | Path | Descripción | Respuesta |
|--------|------|-------------|-----------|
| GET | /scrape | Ejecuta scraping minimal players | `{ inserted, updated, durationMs, ... }` (según implementación) |

---
## Scraper: Flujo y Diseño

### Objetivo
Obtener datos de jugadores (mínimos y luego enriquecidos) desde fuentes externas, poblando tablas `minimal_players` y enriqueciendo `players` / históricos asociados.

### Componentes Clave
- **scraperService**: Orquesta extracción concurrente (`p-limit` con `SCRAPER_CONCURRENCY`).
- **minimalPlayersService**: Base inicial de slugs y nombres.
- **playersModel / player_market_history / player_points**: Persistencia enriquecida.
- **scraperMetadata**: Registro de la última ejecución (para invalidación o UI).

### Concurrencia
Controlada por `SCRAPER_CONCURRENCY` (default 15). Evita saturar la fuente. Parámetro ajustable vía entorno.

### Pasos Típicos (scrapeAllMinimalPlayers)
1. Cargar listado de minimal players (o scrappear plantillas si vacío).
2. Para cada slug: fetch HTML → parse (cheerio) → extraer atributos (valor, riesgo, posición, etc.).
3. Normalizar nombres, generar/ajustar slug si faltase.
4. Upsert jugador en `players`.
5. Registrar histórico de mercado (tabla `player_market_history`) calculando delta.
6. (Opcional) Registrar puntos individuales si aparecen en tabla jornada.
7. Al terminar: actualizar metadata con timestamp e inserciones/errores.

### Recuperación y Reintentos
- Se suele envolver cada request con try/catch; errores de un jugador no abortan el lote.
- Futuro: backoff exponencial / reintentos limitados.

### Rendimiento & Consideraciones
- Riesgo de bloqueo si la fuente limita; ajustar concurrencia.
- Cache HTTP externa no implementada; se puede sumar capa local.
- Logging detallado controlable con `LOG_LEVEL` y flags (`SCRAPER_LOG_TITULAR`).

### Scripts Relacionados
- `runScraper.js`: Ejecuta lote completo manual.
- `scrapSquad.js`: Pobla minimal players por equipo.
- `scrapeOne.js`: Depuración de scraping individual.
- `extractPlayerFromAs.js`: Fuente alternativa.

---
## Códigos de Estado Comunes
| Código | Contexto |
|--------|----------|
| 200 | Operación correcta / listados |
| 201 | Creación de recurso (alta, transferencia, puntos) |
| 204 | (Reservado) Podría usarse en borrados sin body (actualmente se devuelve JSON) |
| 400 | Validación fallida / parámetros insuficientes |
| 404 | Recurso no encontrado (id inexistente) |
| 409 | (Futuro) Conflictos de negocio (cláusula bloqueada, duplicados) |
| 500 | Error interno inesperado |

---
## Backlog Técnico (API/Scraper)
- Añadir autenticación y roles (admin para endpoints destructivos / scraper).
- Paginación en `/market` y `/transfers`.
- Filtros por rango de valor / posición en búsqueda avanzada.
- Reintentos y métricas de scraping (exponer health endpoint con stats).
- Versionado de API (`/api/v1`).
- Normalización completa de nombres de equipos y mapeo oficial.

---
Fin del documento API & Scraper.
