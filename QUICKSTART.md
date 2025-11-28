# PersonalFlow - Quick Start Guide

## ✅ Application Status

**PersonalFlow is now running!**

### Access Points
- **Frontend (React UI)**: http://localhost:3000
- **API**: http://localhost:3124
- **API Documentation (Swagger)**: http://localhost:3124/swagger

## 🚀 Quick Commands

### Start the Application
```bash
docker compose up -d
```

### Stop the Application
```bash
docker compose down
```

### View Logs
```bash
# All logs
docker compose logs -f

# API logs only
docker compose logs -f api

# Frontend logs only
docker compose logs -f frontend
```

### Rebuild After Code Changes
```bash
# Rebuild everything
docker compose build

# Rebuild just the API
docker compose build api

# Rebuild just the frontend
docker compose build frontend
```

### Database Management
The database is stored in a Docker named volume. To reset:
```bash
docker compose down
docker volume rm task-tracker_data
docker compose up -d
```

## 📝 Using the Application

1. Open http://localhost:3000 in your browser
2. Click "New Project" to create your first project
3. Add tasks to your project with the "Add Task" button
4. Track progress using the visual sliders
5. Capture ideas as they come to you with "Add Idea"
6. Use the global search to find anything quickly

## 🔧 Troubleshooting

### Port Already in Use
If ports 3000 or 3124 are in use, edit `docker-compose.yml`:
```yaml
services:
  api:
    ports:
      - "YOUR_PORT:8080"  # Change 3124 to another port
  frontend:
    ports:
      - "YOUR_PORT:80"     # Change 3000 to another port
```

### Database Errors
Restart the API container:
```bash
docker compose restart api
```

### Frontend Not Loading
Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## 🛠️ Development

### Local Development (Without Docker)

**API:**
```bash
cd src/TaskTracker.Api
dotnet run
# API runs on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

## 📊 Features Implemented

✅ Project Management (CRUD)
✅ Task Tracking with Progress Sliders
✅ Visual Status Indicators
✅ Idea Capture
✅ Global Search
✅ REST API
✅ Responsive Design
✅ Modern UI with shadcn/ui
✅ Docker Deployment
✅ Data Persistence

## 🎨 Technology Stack

- **Backend**: .NET 9, ASP.NET Core, Entity Framework Core, SQLite
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query
- **Container**: Docker & Docker Compose

## 📚 Additional Resources

- Full Documentation: [README.md](README.md)
- Product Requirements: [PRD.md](PRD.md)
- Development Guide: [CLAUDE.md](CLAUDE.md)
- API Documentation: http://localhost:3124/swagger (when running)

## 🎉 Enjoy PersonalFlow!

Your self-hosted task management system is ready to use. All your data stays local and under your control.
