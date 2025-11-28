# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PersonalFlow** is a self-hosted task tracker web application that enables users to manage personal and work projects, capture ideas, and track tasks through a modern, intuitive interface. Built with .NET 9 and C# for local deployment with persistent storage, it provides both a user-friendly web interface and REST API for programmatic access.

### Key Product Characteristics
- **Single-user application** (no multi-user collaboration)
- **Local deployment** (self-hosted, Docker containerized)
- **Privacy-focused** (complete data ownership, no cloud dependencies)
- **API-first design** (REST endpoints for all CRUD operations)
- **Web-responsive** (accessible via localhost:3124, optimized for various screen sizes)

## Tech Stack

- **Framework**: .NET 9 with ASP.NET Core
- **Language**: C#
- **Database**: SQLite (lightweight, file-based persistence)
- **Containerization**: Docker & Docker Compose
- **API**: RESTful Web API (all CRUD operations, response time target: <200ms)
- **ORM**: Entity Framework Core
- **Frontend**: HTML/CSS/JavaScript (responsive design for tablets and smaller screens)

## Project Structure

```
task-tracker/
├── src/
│   └── TaskTracker.Api/          # Main ASP.NET Core API project
├── docker-compose.yml             # Docker orchestration
├── Dockerfile                      # Container image definition
├── CLAUDE.md                       # This file
└── README.md
```

## Build and Test Commands

```bash
# Build the project
dotnet build

# Run locally
dotnet run --project src/TaskTracker.Api

# Run tests
dotnet test

# Build Docker image
docker build -t task-tracker:latest .

# Run with Docker Compose
docker-compose up -d

# Stop containers
docker-compose down
```

## Development Environment Setup

1. Install .NET 9 SDK
2. Install Docker Desktop
3. Clone repository and run `dotnet restore`
4. Run `docker-compose up` to start the application

## Key Technical Decisions

- **SQLite** chosen for lightweight persistence without external dependencies
- **Docker Compose** for local development parity with production
- **Entity Framework Core** for data access and migrations
- **Volume mounts** for persistent database file and development convenience
- **Single-user architecture** (no authentication/authorization complexity)
- **Markdown support** for project descriptions
- **Auto-save functionality** to prevent data loss

## Core Features Implementation Roadmap

### Phase 1: MVP Foundation (P0 - Core Features)
- [x] Docker containerization with volume persistence
- [ ] Project management (CRUD with markdown descriptions)
- [ ] Task management (CRUD within projects, status tracking)
- [ ] Visual progress tracking (sliding bar, status indicators: Not Started, In Progress, Completed, Blocked)
- [ ] Ideas capture and linking to projects
- [ ] REST API endpoints for all CRUD operations

### Phase 2: Enhanced UX (P1 - Enhanced Features)
- [ ] Search and filtering (projects, tasks, ideas)
- [ ] Due date management and basic scheduling
- [ ] Responsive design for tablets and smaller screens
- [ ] Export functionality (projects and tasks)

### Phase 3: Polish & Integration (P2 - Nice-to-Have)
- [ ] Task templates for recurring patterns
- [ ] Basic reporting and analytics dashboard
- [ ] Bulk operations
- [ ] Dark/light theme toggle

## Important Directories

- `src/TaskTracker.Api/Controllers/` - REST API endpoints for projects, tasks, ideas
- `src/TaskTracker.Api/Services/` - Business logic layer
- `src/TaskTracker.Api/Data/` - Entity Framework context and configurations
- `src/TaskTracker.Api/Models/` - Domain models (Project, Task, Idea, etc.)

## Domain Models

Based on PRD requirements, implement the following core entities:

- **Project**: Title, description (markdown), creation date, status
- **Task**: Title, description, project reference, status (Not Started, In Progress, Completed, Blocked), priority, progress percentage, due date
- **Idea**: Title, description, project reference, creation date

## API Endpoints

All endpoints should follow RESTful conventions and respond within 200ms:

- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project with tasks and ideas
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `GET /api/tasks` - List all tasks
- `GET /api/tasks?projectId={id}` - Filter tasks by project
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task (including progress)
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/ideas` - List all ideas
- `GET /api/ideas?projectId={id}` - Filter ideas by project
- `POST /api/ideas` - Create idea
- `PUT /api/ideas/{id}` - Update idea
- `DELETE /api/ideas/{id}` - Delete idea
- `GET /api/search?q={query}` - Search across projects, tasks, and ideas

## Database

Database file stored in Docker volume for persistence between container restarts. Initial migrations run automatically on startup.

### Entity Relationships
- Project has many Tasks (1:N)
- Project has many Ideas (1:N)
- Task belongs to one Project (N:1)
- Idea belongs to one Project (N:1)

## Success Metrics & Performance Requirements

- User creates first project within 5 minutes of setup
- API endpoints respond within 200ms for standard operations
- Zero data loss during container restarts (volume persistence)
- Auto-save prevents data loss during unexpected interruptions
- Responsive design works on tablets (768px+) and larger screens
