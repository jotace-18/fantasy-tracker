// Archivo enriquecido: especificación OpenAPI con componentes reutilizables.

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Fantasy Tracker API',
    description: 'API para gestión de jugadores, participantes, mercado y puntuaciones de un fantasy. Especificación enriquecida con componentes reutilizables.',
    version: '1.1.0'
  },
  servers: [
    { url: 'http://localhost:4000/api', description: 'Local Dev' }
  ],
  tags: [
    { name: 'Players', description: 'Gestión y consultas de jugadores' },
    { name: 'Teams', description: 'Equipos y su relación con jugadores' },
    { name: 'Participants', description: 'Participantes del fantasy (capital y puntos)' },
    { name: 'ParticipantPlayers', description: 'Roster de cada participante' },
    { name: 'ParticipantPoints', description: 'Histórico y ajustes de puntos' },
    { name: 'Market', description: 'Mercado de fichajes / jugadores en venta' },
    { name: 'Transfers', description: 'Registro de transferencias y movimientos' },
    { name: 'Calendar', description: 'Jornadas y fechas de cierre' },
    { name: 'MatchResults', description: 'Resultados de partidos por jornada' },
    { name: 'Clock', description: 'Reloj simulado para pruebas/eventos' },
    { name: 'Scraper', description: 'Metadatos de scraping' },
    { name: 'MinimalPlayers', description: 'Altas mínimas antes de datos completos' },
    { name: 'Misc', description: 'Utilidades misceláneas / health' }
  ],
  components: {
    parameters: {
      PageParam: { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 }, required: false, description: 'Número de página (>=1)' },
      LimitParam: { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200 }, required: false, description: 'Tamaño de página (<=200)' },
      SortParam: { name: 'sort', in: 'query', schema: { type: 'string' }, required: false },
      OrderParam: { name: 'order', in: 'query', schema: { type: 'string', enum: ['ASC','DESC'] }, required: false },
      PlayerIdPath: { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      ParticipantIdPath: { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      JornadaQuery: { name: 'jornada', in: 'query', schema: { type: 'integer' }, required: false },
      JornadaIdPath: { name: 'jornadaId', in: 'path', required: true, schema: { type: 'integer' } }
    },
    responses: {
      NotFound: { description: 'Recurso no encontrado' },
      ValidationError: { description: 'Error de validación de entrada' },
      Deleted: { description: 'Recurso eliminado' }
    },
    schemas: {
      Player: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          team: { type: 'string', nullable: true },
          position: { type: 'string', nullable: true },
          market_value: { type: 'string', nullable: true },
          market_delta: { type: 'string', nullable: true },
          risk_level: { type: 'integer', nullable: true }
        },
        example: {
          id: 101,
          name: 'Juan Pérez',
          team: 'Atlético Demo',
          position: 'MC',
          market_value: '2500000',
          market_delta: '+150000',
          risk_level: 1
        }
      },
      PaginatedPlayers: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Player' } },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' }
        }
      },
      Participant: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          money: { type: 'integer', nullable: true },
          total_points: { type: 'integer', nullable: true }
        },
        example: { id: 1, name: 'Manager Demo', money: 50000000, total_points: 123 }
      },
      MarketEntry: {
        type: 'object',
        properties: {
          player_id: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      Team: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          slug: { type: 'string', nullable: true }
        }
      },
      RosterEntry: {
        type: 'object',
        properties: {
          player_id: { type: 'integer' },
          status: { type: 'string', enum: ['R','XI','B'] },
          clause_value: { type: 'integer', nullable: true },
          clausulable: { type: 'boolean', nullable: true },
          clause_lock_at: { type: 'string', format: 'date-time', nullable: true }
        }
      }
    }
  },
  paths: {
    '/players/minimal': {
      post: {
        tags: ['Players'],
        summary: 'Alta mínima de jugador',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name','teamName'], properties: { name: { type: 'string' }, teamName: { type: 'string' }, slug: { type: 'string' } } } } } },
        responses: { 201: { description: 'Creado' }, 400: { $ref: '#/components/responses/ValidationError' } }
      }
    },
    '/players/minimal/bulk': {
      post: {
        tags: ['Players'],
        summary: 'Alta mínima masiva',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['teamName','names'], properties: { teamName: { type: 'string' }, names: { type: 'array', items: { type: 'string' }, minItems: 1 } } } } } },
        responses: { 200: { description: 'Resultado inserción masiva' } }
      }
    },
    '/players/team/{teamId}': {
      get: { tags: ['Players'], summary: 'Jugadores por teamId', parameters: [ { name: 'teamId', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Player' } } } } } } }
    },
    '/players/{id}/team': {
      put: { tags: ['Players'], summary: 'Actualizar team_id (legacy)', parameters: [ { $ref: '#/components/parameters/PlayerIdPath' } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['team_id'], properties: { team_id: { type: 'integer' } } } } } }, responses: { 200: { description: 'Actualizado' }, 404: { $ref: '#/components/responses/NotFound' } } }
    },
    '/players/top': {
      get: { tags: ['Players'], summary: 'Ranking de jugadores top (paginado)', description: 'Acepta sort (alias de sortBy). sortBy se considera deprecated en favor de sort.', parameters: [ { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }, { $ref: '#/components/parameters/SortParam' }, { $ref: '#/components/parameters/OrderParam' } ], responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedPlayers' } } } } } }
    },
    '/players/search': {
      get: { tags: ['Players'], summary: 'Búsqueda avanzada de jugadores', parameters: [ { name: 'name', in: 'query', schema: { type: 'string' } }, { name: 'teamId', in: 'query', schema: { type: 'integer' } }, { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }, { $ref: '#/components/parameters/SortParam' }, { $ref: '#/components/parameters/OrderParam' } ], responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedPlayers' } } } } } }
    },
    '/players/{id}': {
      get: { tags: ['Players'], summary: 'Detalle de jugador', parameters: [ { $ref: '#/components/parameters/PlayerIdPath' }, { name: 'noCache', in: 'query', schema: { type: 'string', enum: ['1'] }, required: false } ], responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Player' } } } }, 404: { $ref: '#/components/responses/NotFound' } } }
    },
    '/players/teams/{slug}/players': {
      get: { tags: ['Players'], summary: 'Jugadores por slug de equipo', parameters: [ { name: 'slug', in: 'path', required: true, schema: { type: 'string' } } ], responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Player' } } } } }, 404: { $ref: '#/components/responses/NotFound' } } }
    },
    '/teams': { get: { tags: ['Teams'], summary: 'Lista equipos', responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Team' } } } } } } } },
    '/teams/{id}/players': { get: { tags: ['Teams'], summary: 'Jugadores de un equipo', parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'OK' }, 404: { $ref: '#/components/responses/NotFound' } } } },
    '/participants': { post: { tags: ['Participants'], summary: 'Crear participante', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, money: { type: 'integer' } } } } } }, responses: { 201: { description: 'Creado' }, 400: { $ref: '#/components/responses/ValidationError' } } }, get: { tags: ['Participants'], summary: 'Listar participantes', responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Participant' } } } } } } } },
    '/participants/leaderboard': { get: { tags: ['Participants'], summary: 'Leaderboard de participantes', parameters: [ { name: 'jornada', in: 'query', schema: { type: 'integer' } } ], responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Participant' } } } } } } } },
    '/participants/{id}': { get: { tags: ['Participants'], summary: 'Detalle participante', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' } ], responses: { 200: { description: 'OK' }, 404: { $ref: '#/components/responses/NotFound' } } }, delete: { tags: ['Participants'], summary: 'Eliminar participante', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' } ], responses: { 200: { description: 'Eliminado' }, 404: { $ref: '#/components/responses/NotFound' } } } },
    '/participants/{id}/points': { put: { tags: ['Participants'], summary: 'Ajustar total puntos', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['total_points'], properties: { total_points: { type: 'integer' } } } } } }, responses: { 200: { description: 'Actualizado' } } } },
    '/participants/{id}/money': { get: { tags: ['Participants'], summary: 'Consultar saldo', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' } ], responses: { 200: { description: 'OK' } } }, put: { tags: ['Participants'], summary: 'Set saldo', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['money'], properties: { money: { type: 'integer' } } } } } }, responses: { 200: { description: 'OK' } } } },
    '/participants/{id}/add-money': { post: { tags: ['Participants'], summary: 'Incrementar saldo', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['amount'], properties: { amount: { type: 'integer' } } } } } }, responses: { 200: { description: 'OK' } } } },
    '/participants/{id}/formation': { put: { tags: ['Participants'], summary: 'Actualizar formación', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['formation'], properties: { formation: { type: 'string', pattern: '^([2-5]-){2}[2-5]$' } } } } } }, responses: { 200: { description: 'OK' }, 400: { $ref: '#/components/responses/ValidationError' } } } },
    '/participant-players/{id}/team': { get: { tags: ['ParticipantPlayers'], summary: 'Roster participante', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' } ], responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RosterEntry' } } } } } } }, post: { tags: ['ParticipantPlayers'], summary: 'Añadir jugador a roster', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['player_id'], properties: { player_id: { type: 'integer' } } } } } }, responses: { 201: { description: 'Insertado' }, 400: { $ref: '#/components/responses/ValidationError' } } } },
    '/participant-players/{id}/team/{playerId}': { put: { tags: ['ParticipantPlayers'], summary: 'Actualizar status jugador', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' }, { name: 'playerId', in: 'path', required: true, schema: { type: 'integer' } } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['R','XI','B'] } } } } } }, responses: { 200: { description: 'OK' } } }, delete: { tags: ['ParticipantPlayers'], summary: 'Eliminar jugador del roster', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' }, { name: 'playerId', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'Eliminado' } } } },
    '/participant-players/{id}/team/{playerId}/clause': { patch: { tags: ['ParticipantPlayers'], summary: 'Actualizar valor cláusula', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' }, { name: 'playerId', in: 'path', required: true, schema: { type: 'integer' } } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['clause_value'], properties: { clause_value: { type: 'integer' } } } } } }, responses: { 200: { description: 'OK' } } } },
    '/participant-players/{id}/team/{playerId}/clausulable': { patch: { tags: ['ParticipantPlayers'], summary: 'Toggle clausulable', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' }, { name: 'playerId', in: 'path', required: true, schema: { type: 'integer' } } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['clausulable'], properties: { clausulable: { type: 'boolean' } } } } } }, responses: { 200: { description: 'OK' } } } },
    '/participant-players/{id}/team/{playerId}/clause-lock': { patch: { tags: ['ParticipantPlayers'], summary: '(Des)bloquear cláusula', parameters: [ { $ref: '#/components/parameters/ParticipantIdPath' }, { name: 'playerId', in: 'path', required: true, schema: { type: 'integer' } } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['locked'], properties: { locked: { type: 'boolean' } } } } } }, responses: { 200: { description: 'OK' } } } },
    '/participant-points': { post: { tags: ['ParticipantPoints'], summary: 'Crear registro puntos', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['participant_id','jornada','points'], properties: { participant_id: { type: 'integer' }, jornada: { type: 'integer' }, points: { type: 'integer' } } } } } }, responses: { 201: { description: 'Creado' } } }, put: { tags: ['ParticipantPoints'], summary: 'Actualizar registro', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['participant_id','jornada','points'], properties: { participant_id: { type: 'integer' }, jornada: { type: 'integer' }, points: { type: 'integer' } } } } } }, responses: { 200: { description: 'OK' } } }, delete: { tags: ['ParticipantPoints'], summary: 'Eliminar registro puntual', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['participant_id','jornada'], properties: { participant_id: { type: 'integer' }, jornada: { type: 'integer' } } } } } }, responses: { 200: { description: 'Eliminado' } } } },
    '/participant-points/{participantId}': { get: { tags: ['ParticipantPoints'], summary: 'Histórico puntos participante', parameters: [ { name: 'participantId', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'OK' } } } },
    '/participant-points/jornada/{jornada}': { delete: { tags: ['ParticipantPoints'], summary: 'Eliminar puntos de una jornada completa', parameters: [ { name: 'jornada', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'Eliminado' } } } },
    '/calendar/next': { get: { tags: ['Calendar'], summary: 'Próximas jornadas con enfrentamientos', responses: { 200: { description: 'OK' } } } },
    '/calendar/{jornadaId}/fecha-cierre': { put: { tags: ['Calendar'], summary: 'Actualizar fecha de cierre jornada', parameters: [ { $ref: '#/components/parameters/JornadaIdPath' } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['fecha_cierre'], properties: { fecha_cierre: { type: 'string', format: 'date-time' } } } } } }, responses: { 200: { description: 'OK' } } } },
    '/match-results': { post: { tags: ['MatchResults'], summary: 'Crear resultado', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['jornada','local_team_id','away_team_id','local_goals','away_goals'], properties: { jornada: { type: 'integer' }, local_team_id: { type: 'integer' }, away_team_id: { type: 'integer' }, local_goals: { type: 'integer' }, away_goals: { type: 'integer' } } } } } }, responses: { 201: { description: 'Creado' } } } },
    '/match-results/jornada/{jornadaId}': { get: { tags: ['MatchResults'], summary: 'Resultados por jornada', parameters: [ { name: 'jornadaId', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'OK' } } } },
    '/match-results/{id}': { get: { tags: ['MatchResults'], summary: 'Detalle resultado', parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'OK' }, 404: { $ref: '#/components/responses/NotFound' } } }, put: { tags: ['MatchResults'], summary: 'Actualizar resultado', parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { local_goals: { type: 'integer' }, away_goals: { type: 'integer' } } } } } }, responses: { 200: { description: 'OK' } } }, delete: { tags: ['MatchResults'], summary: 'Eliminar resultado', parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'Eliminado' } } } },
    '/transfers': { get: { tags: ['Transfers'], summary: 'Listado transferencias', responses: { 200: { description: 'OK' } } }, post: { tags: ['Transfers'], summary: 'Crear transferencia', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['player_id','type','amount'], properties: { player_id: { type: 'integer' }, from_participant_id: { type: 'integer', nullable: true }, to_participant_id: { type: 'integer', nullable: true }, type: { type: 'string' }, amount: { type: 'integer' } } } } } }, responses: { 201: { description: 'Creada' } } }, delete: { tags: ['Transfers'], summary: 'Limpiar todas', responses: { 200: { description: 'OK' } } } },
    '/transfers/{id}': { delete: { tags: ['Transfers'], summary: 'Eliminar transferencia', parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'Eliminada' }, 404: { $ref: '#/components/responses/NotFound' } } } },
    '/minimal-players': { post: { tags: ['MinimalPlayers'], summary: 'Crear jugador mínimo', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { 201: { description: 'Creado' } } }, get: { tags: ['MinimalPlayers'], summary: 'Listar jugadores mínimos', responses: { 200: { description: 'OK' } } } },
    '/minimal-players/{id}': { delete: { tags: ['MinimalPlayers'], summary: 'Eliminar jugador mínimo', parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'Eliminado' } } } },
    '/market': { get: { tags: ['Market'], summary: 'Lista jugadores en mercado', responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/MarketEntry' } } } } } } }, post: { tags: ['Market'], summary: 'Añadir jugador al mercado', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['player_id'], properties: { player_id: { type: 'integer' } } } } } }, responses: { 200: { description: 'Insertado' } } }, delete: { tags: ['Market'], summary: 'Vaciar mercado', responses: { 200: { description: 'Vaciado' } } } },
    '/market/{playerId}': { delete: { tags: ['Market'], summary: 'Eliminar jugador del mercado', parameters: [ { name: 'playerId', in: 'path', required: true, schema: { type: 'integer' } } ], responses: { 200: { description: 'Eliminado' }, 404: { $ref: '#/components/responses/NotFound' } } } },
    '/clock': { get: { tags: ['Clock'], summary: 'Hora simulada', responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { currentTime: { type: 'string', format: 'date-time' } } } } } } } } },
    '/clock/advance': { post: { tags: ['Clock'], summary: 'Avanza minutos simulados', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['minutes'], properties: { minutes: { type: 'integer', minimum: 1 } } } } } }, responses: { 200: { description: 'OK' }, 400: { $ref: '#/components/responses/ValidationError' } } } },
    '/clock/set': { post: { tags: ['Clock'], summary: 'Fijar hora simulada', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['date'], properties: { date: { type: 'string', format: 'date-time' } } } } } }, responses: { 200: { description: 'OK' }, 400: { $ref: '#/components/responses/ValidationError' } } } },
    '/scraper-metadata/last': { get: { tags: ['Scraper'], summary: 'Último timestamp de scraping', responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { lastScrapedAt: { type: 'string', nullable: true }, updatedAt: { type: 'string', nullable: true } } } } } } } } },
    '/health': { get: { tags: ['Misc'], summary: 'Health check (sin prefijo /api en montaje actual)', responses: { 200: { description: 'OK' }, 500: { description: 'Error' } } } }
  }
};
