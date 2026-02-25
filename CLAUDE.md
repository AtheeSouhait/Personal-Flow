# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is (current)

**PersonalFlow** is a self-hosted, single-user task tracker with a .NET Web API backend and a React frontend. It supports projects, tasks (Kanban + progress), ideas, global search, and a “Daily ToDo” list.

**Default deployment** is via Docker Compose (API + nginx-served frontend) with SQLite persisted to disk.

## Tech Stack

### Backend
- .NET 9 (ASP.NET Core Web API)
- Entity Framework Core + SQLite
- Swagger (dev only)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- TanStack Query
- React Router
- Axios API client

## Project Structure

```
task-tracker/
├── src/
│   └── TaskTracker.Api/            # ASP.NET Core API project
├── frontend/                       # React app (Vite), built into nginx for Docker
├── docker-compose.yml              # Docker orchestration (api + frontend)
├── Dockerfile                       # API container image
├── start-task-tracker.sh            # Convenience script (local machine paths)
├── API.md                           # API docs (may lag code)
├── README.md                        # User-facing documentation
└── CLAUDE.md                        # This file
```

## How to run

```bash
# Docker (recommended)
docker compose up -d

# Stop
docker compose down
```

### Ports (docker-compose.yml)

- Frontend UI: http://localhost:3007
- API: http://localhost:3124
- Swagger UI (Development): http://localhost:3124/swagger

Docker port mappings today:
- `frontend`: `3007:80` (nginx)
- `api`: `3124:8080` (ASP.NET)

### Local development (without Docker)

**Backend**

By default the API connection string points at `/app/data/tasktracker.db` (a Docker path). For local runs, override it:

```bash
ConnectionStrings__DefaultConnection="Data Source=./data/tasktracker.db" \
  dotnet run --project src/TaskTracker.Api
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Vite serves at http://localhost:5173 and proxies `/api` to `http://localhost:3124`.

## Backend implementation notes

- On startup the API runs EF Core migrations (`db.Database.Migrate()`).
- SQLite DB path is configured in `src/TaskTracker.Api/appsettings*.json` as `/app/data/tasktracker.db`.
- Ordering is implemented via `DisplayOrder` on Projects, Tasks, and DailyTodos. Reorder endpoints accept an ordered list of IDs and rewrite `DisplayOrder` accordingly.

### Domain model (current)

- `Project` (`ProjectStatus`: `Active | Completed | Archived`)
- `ProjectTask` (`TaskStatus`: `NotStarted | InProgress | Completed | Blocked`, `TaskPriority`: `Low | Medium | High | Critical`)
- `Idea`
- `DailyTodo`

### API endpoints (current)

Base URL: `http://localhost:3124/api`

- **Projects**
  - `GET /api/projects`
  - `GET /api/projects/{id}` (includes tasks + ideas)
  - `POST /api/projects`
  - `PUT /api/projects/{id}`
  - `DELETE /api/projects/{id}`
  - `POST /api/projects/reorder` (`{ projectIds: number[] }`)

- **Tasks**
  - `GET /api/tasks?projectId={id?}`
  - `GET /api/tasks/{id}`
  - `POST /api/tasks`
  - `PUT /api/tasks/{id}`
  - `DELETE /api/tasks/{id}`
  - `POST /api/tasks/reorder` (`{ taskIds: number[] }`)

- **Ideas**
  - `GET /api/ideas?projectId={id?}`
  - `GET /api/ideas/{id}`
  - `POST /api/ideas`
  - `PUT /api/ideas/{id}`
  - `DELETE /api/ideas/{id}`

- **Daily todos**
  - `GET /api/daily-todos`
  - `GET /api/daily-todos/{id}`
  - `POST /api/daily-todos`
  - `PUT /api/daily-todos/{id}`
  - `DELETE /api/daily-todos/{id}`
  - `POST /api/daily-todos/reorder` (`{ todoIds: number[] }`)

- **Search**
  - `GET /api/search?q={query}`

- **TTS proxy (optional integration)**
  - `POST /api/tts/synthesize` (returns `audio/wav`)
  - Proxies to `http://host.docker.internal:8080/synthesize` (expects a host-side service). If unavailable, the API returns 503/504.

## Frontend implementation notes

- Routes:
  - `/` → dashboard (project list + Daily ToDo)
  - `/projects/:id` → project detail (Kanban tasks + ideas)
- API client:
  - `frontend/src/api/client.ts` uses `VITE_API_URL` (defaults to `http://localhost:3124/api`)
  - Local dev also supports calling `/api` thanks to the Vite proxy in `frontend/vite.config.ts`
  - Docker frontend nginx also proxies `/api` to the API container (`frontend/nginx.conf`)
- TypeScript types live in `frontend/src/types/index.ts` and should stay consistent with backend DTOs/enums.

## Docker persistence (current)

`docker-compose.yml` bind-mounts a host folder to `/app/data` in the API container (currently `/mnt/2TO_Projets/Programmation/docker_volumes/task-tracker:/app/data`). If you run on a different machine, you’ll likely need to change the host path.

## Common gotchas

- `docker-compose.yml` currently exposes the UI on `http://localhost:3007` (not `:3000`).
- Enum values are serialized as strings; keep backend enums and frontend union types aligned (`NotStarted`, not `"Not Started"`).
- Reorder endpoints expect full ordered ID lists; they do not accept partial reorder patches.
