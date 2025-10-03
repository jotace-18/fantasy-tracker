# Estructura del Proyecto

Este documento describe el árbol de directorios y la función de cada carpeta y archivo principal del monorepo `fantasy-tracker`.

## Raíz

```
fantasy-tracker/
  backend/
  frontend/
  db/
  Tablas.csv
```

- **backend/**: Código y scripts del servidor (API REST, scraping y lógica fantasy).
- **frontend/**: Aplicación React (UI de gestión, ranking, detalle jugadores, etc.).
- **db/**: (Opcional) Carpeta para artefactos auxiliares de base de datos fuera de `backend/db`.
- **Tablas.csv**: Archivo de referencia/tabulación externa.

---
## Backend

```
backend/
  .env / .env.example
  package.json
  README.MD
  ARCHITECTURE.md (antiguo - será sustituido)
  SCRAPER.md (antiguo - integrado ahora en DOC_API / DOC_STRUCTURE)
  backend.md (obsoleto)
  CalendarioLiguero.csv
  db/
  migrations/
  scripts/
  src/
  tests/
```

### Archivos raíz backend
- **.env / .env.example**: Configuración y ejemplo de variables de entorno.
- **package.json**: Dependencias (Express, sqlite3, jest, supertest, cheerio, axios, p-limit) y scripts (dev, test, etc.).
- **CalendarioLiguero.csv**: Fuente de datos del calendario liga para importaciones.
- **ARCHITECTURE.md / SCRAPER.md / backend.md**: Documentos previos (serán eliminados al centralizar documentación).

### `backend/db/`
```
backend/db/
  fantasy.sqlite
```
Base de datos SQLite principal (persistencia de entidades fantasy). Se genera/actualiza dinámicamente; no contiene código.

### `backend/migrations/`
Scripts unitarios de migración incremental (timestamp + descripción). Cada archivo ejecuta cambios atómicos sobre la estructura o datos (e.g., añadir columnas, arreglar FKs, poblar seeds, crear tablas de mercado, transfers, match_results, etc.). Ejecutables manualmente vía `node migrations/<file>.js`.

### `backend/scripts/`
Scripts operativos y utilidades de mantenimiento:
- **seedTeams.js**: Upsert de equipos base.
- **runScraper.js / scrapSquad.js / scrapeOne.js**: Ejecuciones de scraping (global, plantillas, uno a uno).
- **extractPlayerFromAs.js**: Extracción puntual desde fuente alternativa.
- **migrate.js**: Migración puntual legacy (team_id → team TEXT).
- **clean_*.js**: Limpiezas selectivas o totales (players, minimal_players, points, etc.).
- **recalcTotals.js**: Recalcula puntos acumulados por participante.
- **resetMoney.js**: Resetea el dinero de todos los participantes.

### `backend/src/`
```
backend/src/
  index.js
  app.js
  config.js
  logger.js
  utils/
  db/
  models/
  services/
  controllers/
  routes/
  scripts/ (internos específicos runtime si existieran)
```

- **index.js**: Arranque HTTP (levanta Express en `PORT`).
- **app.js**: Construcción de la instancia Express (middlewares + montaje rutas, exportable para tests).
- **config.js**: Carga y validación de variables de entorno (`PORT`, `SCRAPER_CONCURRENCY`, etc.).
- **logger.js**: Logger minimal con niveles filtrados.
- **utils/**: Helpers (p.ej. validaciones, slugify, etc.).
- **db/**: Inicialización de conexión SQLite y creación condicional de tablas.
- **models/**: Acceso CRUD a tablas (capa de persistencia, callbacks/Promesas).
- **services/**: Lógica de negocio y agregación multi-modelo.
- **controllers/**: Capa HTTP que valida parámetros y traduce a servicios.
- **routes/**: Definición de endpoints y middlewares específicos (cache, orden rutas).

### `backend/tests/`
Pruebas con Jest + Supertest: smoke, mutaciones (market, participants, clause), robustez de parámetros, bypass de caché, etc. Aísla DB mediante copia o path alternativo.

---
## Frontend

```
frontend/
  index.html
  package.json
  vite.config.js
  README.md
  src/
  public/
  eslint.config.js
  frontend.md (obsoleto, será eliminado)
```

- **index.html**: Entrada de la SPA (Vite).
- **vite.config.js**: Configuración de build/dev.
- **README.md**: Documentación breve del frontend (se puede alinear con nuevas docs si se desea).
- **eslint.config.js**: Reglas de lint.

### `frontend/src/`
```
frontend/src/
  main.jsx
  App.jsx
  routes/
  pages/
  components/
  hooks/
  utils/
  assets/
  data/
  theme.js
```

- **main.jsx**: Bootstrap React + proveedores (Chakra UI).
- **App.jsx**: Monta `AppRouter` / layout raíz.
- **routes/**: Configuración de rutas React Router.
- **pages/**: Páginas de alto nivel (Players, Teams, MyTeam, Leaderboard, Analysis, Dashboard, etc.).
- **components/**: Componentes reutilizables (PlayerSearch, Layout, tablas, gráficos placeholder, etc.).
- **hooks/**: Hooks personalizados (si existieran: fetchers, debounced, etc.).
- **utils/**: Funciones varias (formateo, mapping colores, etc.).
- **assets/**: Imágenes / estáticos.
- **data/**: Datos mock o estáticos auxiliares.
- **theme.js**: Customización de tema Chakra (colores, tipografías).

---
## Convenciones Generales
- Nombres de migraciones: prefijo fecha (ddmmyyyy) + descripción.
- Controladores y servicios alineados por nombre (players, participants, market...).
- Rutas: plural por recurso base. Sub-rutas semánticas (e.g. `/leaderboard`, `/search`).
- Tests: agrupar escenarios por feature para aislar fallos rápidamente.
- Scripts destructivos llevan advertencia y suelen ejecutar VACUUM cuando aplica.

## Próximas Mejoras Sugeridas (estructura)
- Separar `backend/src/scripts/` de `backend/scripts/` si se añaden scripts runtime vs CLI.
- Añadir `docs/` dedicadas en raíz y mover allí `DOC_STRUCTURE.md` y `DOC_API.md`.
- Incorporar un generador automático de doc a partir de JSDoc (compilación CI).

---
Fin del documento de estructura.
