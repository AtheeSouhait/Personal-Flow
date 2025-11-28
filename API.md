# PersonalFlow Task Tracker API Documentation

## Overview

The PersonalFlow API is a RESTful API built with ASP.NET Core 9 that provides endpoints for managing projects, tasks, and ideas. All endpoints return JSON responses and follow standard HTTP status codes.

**Base URL**: `http://localhost:3124/api`

**Response Format**: JSON

**Performance Target**: <200ms response time for standard operations

## Table of Contents

- [Authentication](#authentication)
- [Common Response Codes](#common-response-codes)
- [Projects API](#projects-api)
- [Tasks API](#tasks-api)
- [Ideas API](#ideas-api)
- [Search API](#search-api)
- [Data Models](#data-models)

---

## Authentication

Currently, the API does not require authentication as it is designed for single-user, local deployment.

---

## Common Response Codes

| Status Code | Description |
|------------|-------------|
| `200 OK` | Request successful |
| `201 Created` | Resource successfully created |
| `204 No Content` | Request successful, no content to return (typically for DELETE) |
| `400 Bad Request` | Invalid request parameters |
| `404 Not Found` | Resource not found |
| `500 Internal Server Error` | Server error |

---

## Projects API

### Get All Projects

Retrieve a list of all projects with summary information.

**Endpoint**: `GET /api/projects`

**Response**: `200 OK`

```json
[
  {
    "id": 1,
    "title": "Website Redesign",
    "description": "Redesign company website with modern UI",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-20T14:30:00Z",
    "status": "Active",
    "taskCount": 12,
    "completedTaskCount": 8,
    "ideaCount": 5,
    "progressPercentage": 66.67
  }
]
```

---

### Get Project by ID

Retrieve detailed information about a specific project, including all associated tasks and ideas.

**Endpoint**: `GET /api/projects/{id}`

**Parameters**:
- `id` (path, integer) - Project ID

**Response**: `200 OK`

```json
{
  "id": 1,
  "title": "Website Redesign",
  "description": "Redesign company website with modern UI",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-20T14:30:00Z",
  "status": "Active",
  "taskCount": 12,
  "completedTaskCount": 8,
  "ideaCount": 5,
  "progressPercentage": 66.67,
  "tasks": [
    {
      "id": 1,
      "title": "Design homepage mockup",
      "description": "Create Figma mockups for the new homepage",
      "projectId": 1,
      "projectTitle": "Website Redesign",
      "status": "Completed",
      "priority": "High",
      "progressPercentage": 100,
      "dueDate": "2025-01-25T00:00:00Z",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-18T16:45:00Z"
    }
  ],
  "ideas": [
    {
      "id": 1,
      "title": "Add dark mode toggle",
      "description": "Consider implementing a dark/light theme switcher",
      "projectId": 1,
      "projectTitle": "Website Redesign",
      "createdAt": "2025-01-16T09:15:00Z",
      "updatedAt": "2025-01-16T09:15:00Z"
    }
  ]
}
```

**Error Response**: `404 Not Found`

```json
{
  "message": "Project not found"
}
```

---

### Create Project

Create a new project.

**Endpoint**: `POST /api/projects`

**Request Body**:

```json
{
  "title": "Mobile App Development",
  "description": "Build a cross-platform mobile app using React Native"
}
```

**Field Requirements**:
- `title` (required, string) - Project title
- `description` (optional, string) - Project description (supports Markdown)

**Response**: `201 Created`

```json
{
  "id": 2,
  "title": "Mobile App Development",
  "description": "Build a cross-platform mobile app using React Native",
  "createdAt": "2025-01-20T15:00:00Z",
  "updatedAt": "2025-01-20T15:00:00Z",
  "status": "Active",
  "taskCount": 0,
  "completedTaskCount": 0,
  "ideaCount": 0,
  "progressPercentage": 0,
  "tasks": [],
  "ideas": []
}
```

---

### Update Project

Update an existing project.

**Endpoint**: `PUT /api/projects/{id}`

**Parameters**:
- `id` (path, integer) - Project ID

**Request Body**:

```json
{
  "title": "Mobile App Development - iOS & Android",
  "description": "Updated description with more details",
  "status": "Completed"
}
```

**Field Requirements** (all optional):
- `title` (string) - Updated project title
- `description` (string) - Updated project description
- `status` (string) - Project status (e.g., "Active", "Completed", "OnHold")

**Response**: `200 OK`

Returns the updated project details (same format as Get Project by ID).

**Error Response**: `404 Not Found`

```json
{
  "message": "Project not found"
}
```

---

### Delete Project

Delete a project and all associated tasks and ideas.

**Endpoint**: `DELETE /api/projects/{id}`

**Parameters**:
- `id` (path, integer) - Project ID

**Response**: `204 No Content`

**Error Response**: `404 Not Found`

```json
{
  "message": "Project not found"
}
```

---

## Tasks API

### Get All Tasks

Retrieve all tasks, optionally filtered by project.

**Endpoint**: `GET /api/tasks`

**Query Parameters**:
- `projectId` (optional, integer) - Filter tasks by project ID

**Examples**:
- Get all tasks: `GET /api/tasks`
- Get tasks for project 1: `GET /api/tasks?projectId=1`

**Response**: `200 OK`

```json
[
  {
    "id": 1,
    "title": "Design homepage mockup",
    "description": "Create Figma mockups for the new homepage",
    "projectId": 1,
    "projectTitle": "Website Redesign",
    "status": "Completed",
    "priority": "High",
    "progressPercentage": 100,
    "dueDate": "2025-01-25T00:00:00Z",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-18T16:45:00Z"
  }
]
```

---

### Get Task by ID

Retrieve a specific task by ID.

**Endpoint**: `GET /api/tasks/{id}`

**Parameters**:
- `id` (path, integer) - Task ID

**Response**: `200 OK`

```json
{
  "id": 1,
  "title": "Design homepage mockup",
  "description": "Create Figma mockups for the new homepage",
  "projectId": 1,
  "projectTitle": "Website Redesign",
  "status": "Completed",
  "priority": "High",
  "progressPercentage": 100,
  "dueDate": "2025-01-25T00:00:00Z",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-18T16:45:00Z"
}
```

**Error Response**: `404 Not Found`

```json
{
  "message": "Task not found"
}
```

---

### Create Task

Create a new task within a project.

**Endpoint**: `POST /api/tasks`

**Request Body**:

```json
{
  "title": "Implement authentication",
  "description": "Add JWT-based authentication to the API",
  "projectId": 1,
  "status": "NotStarted",
  "priority": "High",
  "progressPercentage": 0,
  "dueDate": "2025-02-01T00:00:00Z"
}
```

**Field Requirements**:
- `title` (required, string) - Task title
- `projectId` (required, integer) - ID of the parent project
- `description` (optional, string) - Task description
- `status` (optional, string) - Task status: "NotStarted", "InProgress", "Completed", "Blocked" (default: "NotStarted")
- `priority` (optional, string) - Task priority: "Low", "Medium", "High" (default: "Medium")
- `progressPercentage` (optional, integer) - Progress 0-100 (default: 0)
- `dueDate` (optional, datetime) - Due date in ISO 8601 format

**Response**: `201 Created`

```json
{
  "id": 2,
  "title": "Implement authentication",
  "description": "Add JWT-based authentication to the API",
  "projectId": 1,
  "projectTitle": "Website Redesign",
  "status": "NotStarted",
  "priority": "High",
  "progressPercentage": 0,
  "dueDate": "2025-02-01T00:00:00Z",
  "createdAt": "2025-01-20T15:30:00Z",
  "updatedAt": "2025-01-20T15:30:00Z"
}
```

---

### Update Task

Update an existing task.

**Endpoint**: `PUT /api/tasks/{id}`

**Parameters**:
- `id` (path, integer) - Task ID

**Request Body**:

```json
{
  "status": "InProgress",
  "progressPercentage": 45
}
```

**Field Requirements** (all optional):
- `title` (string) - Updated task title
- `description` (string) - Updated description
- `status` (string) - Updated status: "NotStarted", "InProgress", "Completed", "Blocked"
- `priority` (string) - Updated priority: "Low", "Medium", "High"
- `progressPercentage` (integer) - Updated progress 0-100
- `dueDate` (datetime) - Updated due date

**Response**: `200 OK`

Returns the updated task details (same format as Get Task by ID).

**Error Response**: `404 Not Found`

```json
{
  "message": "Task not found"
}
```

---

### Delete Task

Delete a task.

**Endpoint**: `DELETE /api/tasks/{id}`

**Parameters**:
- `id` (path, integer) - Task ID

**Response**: `204 No Content`

**Error Response**: `404 Not Found`

```json
{
  "message": "Task not found"
}
```

---

## Ideas API

### Get All Ideas

Retrieve all ideas, optionally filtered by project.

**Endpoint**: `GET /api/ideas`

**Query Parameters**:
- `projectId` (optional, integer) - Filter ideas by project ID

**Examples**:
- Get all ideas: `GET /api/ideas`
- Get ideas for project 1: `GET /api/ideas?projectId=1`

**Response**: `200 OK`

```json
[
  {
    "id": 1,
    "title": "Add dark mode toggle",
    "description": "Consider implementing a dark/light theme switcher",
    "projectId": 1,
    "projectTitle": "Website Redesign",
    "createdAt": "2025-01-16T09:15:00Z",
    "updatedAt": "2025-01-16T09:15:00Z"
  }
]
```

---

### Get Idea by ID

Retrieve a specific idea by ID.

**Endpoint**: `GET /api/ideas/{id}`

**Parameters**:
- `id` (path, integer) - Idea ID

**Response**: `200 OK`

```json
{
  "id": 1,
  "title": "Add dark mode toggle",
  "description": "Consider implementing a dark/light theme switcher",
  "projectId": 1,
  "projectTitle": "Website Redesign",
  "createdAt": "2025-01-16T09:15:00Z",
  "updatedAt": "2025-01-16T09:15:00Z"
}
```

**Error Response**: `404 Not Found`

```json
{
  "message": "Idea not found"
}
```

---

### Create Idea

Create a new idea linked to a project.

**Endpoint**: `POST /api/ideas`

**Request Body**:

```json
{
  "title": "Implement real-time collaboration",
  "description": "Explore WebSockets for real-time updates",
  "projectId": 1
}
```

**Field Requirements**:
- `title` (required, string) - Idea title
- `projectId` (required, integer) - ID of the parent project
- `description` (optional, string) - Idea description

**Response**: `201 Created`

```json
{
  "id": 2,
  "title": "Implement real-time collaboration",
  "description": "Explore WebSockets for real-time updates",
  "projectId": 1,
  "projectTitle": "Website Redesign",
  "createdAt": "2025-01-20T16:00:00Z",
  "updatedAt": "2025-01-20T16:00:00Z"
}
```

---

### Update Idea

Update an existing idea.

**Endpoint**: `PUT /api/ideas/{id}`

**Parameters**:
- `id` (path, integer) - Idea ID

**Request Body**:

```json
{
  "title": "Implement real-time collaboration (Phase 2)",
  "description": "Explore WebSockets for real-time updates - planned for Phase 2"
}
```

**Field Requirements** (all optional):
- `title` (string) - Updated idea title
- `description` (string) - Updated description

**Response**: `200 OK`

Returns the updated idea details (same format as Get Idea by ID).

**Error Response**: `404 Not Found`

```json
{
  "message": "Idea not found"
}
```

---

### Delete Idea

Delete an idea.

**Endpoint**: `DELETE /api/ideas/{id}`

**Parameters**:
- `id` (path, integer) - Idea ID

**Response**: `204 No Content`

**Error Response**: `404 Not Found`

```json
{
  "message": "Idea not found"
}
```

---

## Search API

### Search Across All Entities

Search for projects, tasks, and ideas by keyword.

**Endpoint**: `GET /api/search`

**Query Parameters**:
- `q` (required, string) - Search query

**Example**: `GET /api/search?q=authentication`

**Response**: `200 OK`

```json
{
  "projects": [
    {
      "id": 1,
      "title": "User Authentication System",
      "description": "Build secure authentication",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-20T14:30:00Z",
      "status": "Active",
      "taskCount": 5,
      "completedTaskCount": 2,
      "ideaCount": 3,
      "progressPercentage": 40.0
    }
  ],
  "tasks": [
    {
      "id": 2,
      "title": "Implement authentication",
      "description": "Add JWT-based authentication to the API",
      "projectId": 1,
      "projectTitle": "Website Redesign",
      "status": "InProgress",
      "priority": "High",
      "progressPercentage": 45,
      "dueDate": "2025-02-01T00:00:00Z",
      "createdAt": "2025-01-20T15:30:00Z",
      "updatedAt": "2025-01-20T17:00:00Z"
    }
  ],
  "ideas": [
    {
      "id": 5,
      "title": "Two-factor authentication",
      "description": "Add 2FA support for enhanced security",
      "projectId": 1,
      "projectTitle": "Website Redesign",
      "createdAt": "2025-01-18T11:00:00Z",
      "updatedAt": "2025-01-18T11:00:00Z"
    }
  ],
  "totalResults": 3
}
```

**Error Response**: `400 Bad Request`

```json
{
  "message": "Search query cannot be empty"
}
```

---

## Data Models

### ProjectDto

```typescript
{
  id: number
  title: string
  description: string | null
  createdAt: datetime
  updatedAt: datetime
  status: string              // Default: "Active"
  taskCount: number
  completedTaskCount: number
  ideaCount: number
  progressPercentage: number  // Calculated from tasks
}
```

### ProjectDetailDto

Extends `ProjectDto` with:

```typescript
{
  tasks: TaskDto[]
  ideas: IdeaDto[]
}
```

### TaskDto

```typescript
{
  id: number
  title: string
  description: string | null
  projectId: number
  projectTitle: string
  status: string              // "NotStarted" | "InProgress" | "Completed" | "Blocked"
  priority: string            // "Low" | "Medium" | "High"
  progressPercentage: number  // 0-100
  dueDate: datetime | null
  createdAt: datetime
  updatedAt: datetime
}
```

### IdeaDto

```typescript
{
  id: number
  title: string
  description: string | null
  projectId: number
  projectTitle: string
  createdAt: datetime
  updatedAt: datetime
}
```

### SearchResultDto

```typescript
{
  projects: ProjectDto[]
  tasks: TaskDto[]
  ideas: IdeaDto[]
  totalResults: number
}
```

---

## Usage Examples

### Creating a Complete Project Workflow

1. **Create a project**:
```bash
curl -X POST http://localhost:3124/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Website",
    "description": "Build a modern website"
  }'
```

2. **Add tasks to the project**:
```bash
curl -X POST http://localhost:3124/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design mockups",
    "projectId": 1,
    "priority": "High",
    "status": "NotStarted"
  }'
```

3. **Update task progress**:
```bash
curl -X PUT http://localhost:3124/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "InProgress",
    "progressPercentage": 50
  }'
```

4. **Add an idea**:
```bash
curl -X POST http://localhost:3124/api/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add blog section",
    "description": "Consider adding a blog to the website",
    "projectId": 1
  }'
```

5. **Search across all content**:
```bash
curl -X GET "http://localhost:3124/api/search?q=blog"
```

---

## Performance Considerations

- All endpoints are designed to respond within **200ms** for standard operations
- The API uses Entity Framework Core with SQLite for efficient data access
- Pagination is not currently implemented but may be added for large datasets
- Search performs case-insensitive partial matching across title and description fields

---

## Error Handling

All errors return a JSON object with a `message` field:

```json
{
  "message": "Descriptive error message"
}
```

Common error scenarios:
- **404 Not Found**: Resource with specified ID doesn't exist
- **400 Bad Request**: Invalid request data or missing required fields
- **500 Internal Server Error**: Unexpected server error

---

## Version History

- **v0.1.0** (Current) - Initial API implementation with full CRUD operations for Projects, Tasks, Ideas, and Search functionality

---

## Future Enhancements

Planned features for future API versions:
- Pagination support for list endpoints
- Advanced filtering and sorting options
- Bulk operations
- Export endpoints (JSON, CSV formats)
- Task templates
- Analytics and reporting endpoints
