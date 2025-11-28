# PersonalFlow - Task Tracker

A modern, self-hosted task management application built with .NET 9 and React. Track personal and work projects, manage tasks with visual progress indicators, and capture ideas - all with complete data ownership through local deployment.

## Features

- **Project Management**: Create and organize multiple projects with markdown-supported descriptions
- **Task Tracking**: Manage tasks with status indicators (Not Started, In Progress, Completed, Blocked)
- **Visual Progress**: Sliding progress bars and percentage tracking for tasks and projects
- **Idea Capture**: Quickly capture and link ideas to specific projects
- **Search**: Global search across projects, tasks, and ideas
- **Modern UI**: Beautiful, responsive interface built with React, Tailwind CSS, and shadcn/ui
- **REST API**: Full REST API for programmatic access to all data
- **Docker Ready**: Containerized for easy deployment and data persistence

## Tech Stack

### Backend
- **.NET 9** with ASP.NET Core
- **SQLite** for lightweight data persistence
- **Entity Framework Core** for data access
- **RESTful API** with Swagger documentation

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful UI components
- **TanStack Query** for data fetching and caching
- **React Router** for navigation

## Prerequisites

- **Docker Desktop** (recommended) OR
- **.NET 9 SDK** and **Node.js 20+** for local development

## Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd task-tracker
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:3124
   - API Documentation: http://localhost:3124/swagger

4. Stop the application:
```bash
docker-compose down
```

## Local Development Setup

### Backend Setup

1. Navigate to the API project:
```bash
cd src/TaskTracker.Api
```

2. Restore dependencies:
```bash
dotnet restore
```

3. Run the API:
```bash
dotnet run
```

The API will be available at http://localhost:3124

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## Project Structure

```
task-tracker/
├── src/
│   └── TaskTracker.Api/          # .NET API project
│       ├── Controllers/          # REST API endpoints
│       ├── Services/             # Business logic
│       ├── Data/                 # EF Core context
│       └── Models/               # Domain models & DTOs
├── frontend/                      # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── api/                  # API client
│   │   └── types/                # TypeScript types
│   └── public/                   # Static assets
├── docker-compose.yml             # Docker orchestration
├── Dockerfile                     # API container
└── README.md
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks?projectId={id}` - Filter tasks by project
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Ideas
- `GET /api/ideas` - List all ideas
- `GET /api/ideas?projectId={id}` - Filter ideas by project
- `POST /api/ideas` - Create idea
- `PUT /api/ideas/{id}` - Update idea
- `DELETE /api/ideas/{id}` - Delete idea

### Search
- `GET /api/search?q={query}` - Search across all entities

## Data Persistence

The SQLite database is stored in a Docker volume, ensuring data persists between container restarts. The database file is located at:
- Docker: `/app/data/tasktracker.db`
- Local: `./data/tasktracker.db`

## Development

### Building for Production

**Backend:**
```bash
dotnet build -c Release
dotnet publish -c Release -o ./publish
```

**Frontend:**
```bash
cd frontend
npm run build
```

### Running Tests

```bash
dotnet test
```

## Configuration

### API Configuration
Edit `src/TaskTracker.Api/appsettings.json` to configure:
- Database connection string
- Logging levels
- CORS policies

### Frontend Configuration
Edit `frontend/.env` to configure:
- `VITE_API_URL` - API base URL

## Troubleshooting

### Port Conflicts
If ports 3000 or 3124 are already in use, modify the ports in `docker-compose.yml`:

```yaml
services:
  api:
    ports:
      - "YOUR_PORT:8080"
  frontend:
    ports:
      - "YOUR_PORT:80"
```

### Database Issues
To reset the database:
```bash
docker-compose down
rm -rf data/
docker-compose up -d
```

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

This project is open source and available for personal use.

## Roadmap

See [CLAUDE.md](CLAUDE.md) for the complete feature roadmap:
- ✅ Phase 1: MVP Foundation (Core features)
- 🚧 Phase 2: Enhanced UX (Search, filtering, responsive design)
- 📋 Phase 3: Polish & Integration (Templates, analytics, exports)

## Support

For issues or questions, please check:
- API Documentation: http://localhost:3124/swagger
- Project Documentation: [PRD.md](PRD.md) and [CLAUDE.md](CLAUDE.md)
