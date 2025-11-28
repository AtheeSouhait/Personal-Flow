# One-pager: PersonalFlow Task Tracker

## 1. TL;DR
PersonalFlow is a dockerized web application that enables individual users to track personal and work projects, ideas, and tasks through a modern, intuitive interface. Built for local deployment with persistent storage, it serves as both a user-friendly task management system and a data source for other local applications via REST API integration.

### Tech Stack
**Backend**: .NET 9 (C#) with ASP.NET Core, Entity Framework Core, SQLite
**Frontend**: React 18 + TypeScript, Vite, TanStack React Query, Tailwind CSS, shadcn/ui
**Deployment**: Docker & Docker Compose with volume persistence
**API**: RESTful architecture with comprehensive CRUD endpoints

## 2. Goals
### Business Goals
* Create a self-hosted solution that eliminates dependency on external task management services
* Establish a foundation for potential future expansions or integrations with other productivity tools
* Demonstrate technical capabilities in full-stack development and containerization

### User Goals
* Centrally organize multiple projects and track associated ideas, tasks, and progress
* Access task information through both web interface and programmatic API
* Maintain complete data ownership and privacy through local deployment
* Experience smooth task management with visual progress indicators and modern UX

### Non-Goals
* Multi-user collaboration or sharing features
* Cloud hosting or SaaS deployment model
* Integration with external third-party services (Slack, Jira, etc.)
* Mobile app development (web-responsive only)

## 3. User stories
**Primary Persona: Solo Professional/Developer**
* As a solo worker, I want to track multiple personal and work projects so I can maintain focus across different initiatives
* As a project manager, I need to capture spontaneous ideas and link them to relevant projects so creative thoughts aren't lost
* As a developer, I want API access to my task data so I can build custom integrations with other local tools
* As a privacy-conscious user, I need local data storage so my personal and professional information stays under my control

## 4. Functional requirements
### Core Features (P0) - ✅ IMPLEMENTED
* ✅ Project creation and management with markdown support for descriptions
* ✅ Task creation, editing, and organization within projects
* ✅ Visual progress tracking with progress bars and status indicators (Not Started, In Progress, Completed, Blocked)
* ✅ Ideas capture and linking to specific projects
* ✅ REST API endpoints for all CRUD operations (Projects, Tasks, Ideas, Search)
* ✅ Delete project functionality with confirmation dialog
* ✅ Inline editing for tasks and ideas (editable text component)
* ✅ Task progress tracking with slider component
* ✅ Priority levels for tasks
* ✅ Status badges and visual indicators
* ✅ Dashboard with project overview cards showing task counts, completion metrics, and ideas

### Enhanced Features (P1) - 🚧 IN PROGRESS
* ✅ Search functionality across projects, tasks, and ideas (API implemented)
* ✅ Responsive design with modern UI components (React + Tailwind CSS + shadcn/ui)
* 🚧 Due date management and basic scheduling (model supports it, UI pending)
* ⏳ Export functionality for projects and tasks (pending)
* ⏳ Advanced filtering UI (pending)

### Nice-to-Have Features (P2) - ⏳ PLANNED
* ⏳ Task templates for recurring work patterns
* ⏳ Basic reporting and analytics dashboard
* ⏳ Bulk operations for task management
* ⏳ Dark/light theme toggle

## 5. User experience
### Primary User Journey
* User accesses web interface through localhost
* Creates new project with title, description (markdown), and initial ideas
* Adds tasks to project with descriptions, priority levels, and initial status
* Updates task progress using sliding bar and status dropdown
* Views project overview with visual progress indicators
* Searches across all content using global search feature

### Edge Cases and UI Notes
* Handle empty states gracefully with helpful onboarding prompts
* Ensure data persistence during Docker container restarts
* Implement auto-save functionality to prevent data loss
* Provide clear error messages for API failures
* Maintain responsive design for tablets and smaller screens

## 6. Narrative
Sarah starts her morning by navigating to localhost:3000 where PersonalFlow loads instantly. She reviews her three active projects: "Website Redesign," "Personal Blog," and "Home Automation." The dashboard shows her Website Redesign is 75% complete with two tasks in progress. She clicks into the project and moves "Deploy to staging" from 60% to 90% complete using the smooth sliding progress bar. An idea pops up about adding a contact form, which she quickly captures and links to the project. Later, her personal automation script pulls today's high-priority tasks via the API to display on her desktop widget. By evening, she's completed two tasks, captured three new ideas, and feels organized and productive.

## 7. Success metrics
* User completes initial setup and creates first project within 5 minutes
* User regularly updates task progress (at least 3 interactions per week)
* User captures and organizes at least 10 ideas per month
* API endpoints respond within 200ms for standard operations
* User continues using the application for at least 30 days post-setup
* Zero data loss incidents during container operations

## 8. Milestones & sequencing
### Phase 1: MVP Foundation - ✅ COMPLETED
* ✅ Docker containerization with volume persistence
* ✅ Modern React frontend with TypeScript and Vite
* ✅ .NET 9 backend with Entity Framework Core
* ✅ SQLite database with migrations
* ✅ Core CRUD operations for projects, tasks, and ideas
* ✅ Essential API endpoints (ProjectsController, TasksController, IdeasController, SearchController)
* ✅ Service layer architecture (IProjectService, ITaskService, IIdeaService)

### Phase 2: Enhanced UX - ✅ COMPLETED
* ✅ Visual progress bars and status management with sliding bar
* ✅ Ideas capture and project linking
* ✅ Search API implementation
* ✅ Responsive design with Tailwind CSS and shadcn/ui components
* ✅ Dashboard with project cards showing metrics
* ✅ Project detail pages with tabs for tasks and ideas
* ✅ Inline editing functionality (EditableText component)
* ✅ Delete project with confirmation dialog
* ✅ Task and idea lists with real-time updates (React Query)
* ✅ Markdown rendering for project descriptions

### Phase 3: Polish & Integration - 🚧 IN PROGRESS
* ✅ React Query for data fetching and caching
* ✅ Modern UI components library (Radix UI primitives)
* ✅ Type-safe API client with TypeScript
* ✅ Complete API documentation (pending)
* ⏳ Error handling and edge case management (partial)
* ⏳ Performance optimization (ongoing)
* ⏳ Export functionality (pending)
* ⏳ Due date UI implementation (pending)

### Phase 4: Advanced Features - ⏳ PLANNED
* ⏳ Task templates
* ⏳ Analytics dashboard
* ⏳ Bulk operations
* ⏳ Theme toggle

## 9. Technical Implementation Summary

### Backend Architecture
* **Framework**: ASP.NET Core 9 with C#
* **Database**: SQLite with Entity Framework Core
* **API Pattern**: RESTful services with controller → service → repository pattern
* **Controllers**: ProjectsController, TasksController, IdeasController, SearchController
* **Services**: IProjectService, ITaskService, IIdeaService with concrete implementations
* **Models**: Project, ProjectTask, Idea with DTOs for API contracts
* **Database Context**: TaskTrackerDbContext with initial migration

### Frontend Architecture
* **Framework**: React 18 with TypeScript
* **Build Tool**: Vite
* **Routing**: React Router v6
* **State Management**: TanStack React Query for server state
* **Styling**: Tailwind CSS v3
* **UI Components**: shadcn/ui (Radix UI primitives)
* **HTTP Client**: Axios
* **Markdown**: react-markdown for rich text rendering

### Key Components Implemented
* **Layout**: Main application layout with navigation
* **Dashboard**: Project overview with cards, progress indicators, and metrics
* **ProjectDetail**: Detailed project view with tasks and ideas tabs
* **TaskList**: Task management with inline editing and progress tracking
* **IdeaList**: Idea capture with inline editing
* **CreateProjectDialog**: Modal for creating new projects
* **CreateTaskDialog**: Modal for creating tasks with status, priority, and progress
* **CreateIdeaDialog**: Modal for capturing ideas
* **DeleteProjectDialog**: Confirmation dialog for project deletion
* **EditableText**: Reusable inline editing component for text fields

### API Endpoints Implemented
* `GET /api/projects` - List all projects with metrics
* `GET /api/projects/{id}` - Get project details with tasks and ideas
* `POST /api/projects` - Create new project
* `PUT /api/projects/{id}` - Update project
* `DELETE /api/projects/{id}` - Delete project
* `GET /api/tasks` - List all tasks
* `GET /api/tasks?projectId={id}` - Filter tasks by project
* `POST /api/tasks` - Create task
* `PUT /api/tasks/{id}` - Update task
* `DELETE /api/tasks/{id}` - Delete task
* `GET /api/ideas` - List all ideas
* `GET /api/ideas?projectId={id}` - Filter ideas by project
* `POST /api/ideas` - Create idea
* `PUT /api/ideas/{id}` - Update idea
* `DELETE /api/ideas/{id}` - Delete idea
* `GET /api/search?q={query}` - Search across all entities

### Docker Configuration
* Multi-stage Dockerfile for optimized .NET builds
* Docker Compose for orchestration with volume persistence
* SQLite database persisted in Docker volume
* Frontend served via static files or separate container 