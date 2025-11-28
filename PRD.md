# One-pager: PersonalFlow Task Tracker

## 1. TL;DR
PersonalFlow is a dockerized web application that enables individual users to track personal and work projects, ideas, and tasks through a modern, intuitive interface. Built for local deployment with persistent storage, it serves as both a user-friendly task management system and a data source for other local applications via REST API integration.

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
### Core Features (P0)
* Project creation and management with markdown support for descriptions
* Task creation, editing, and organization within projects
* Visual progress tracking with sliding bar and status indicators (Not Started, In Progress, Completed, Blocked)
* Ideas capture and linking to specific projects
* REST API endpoints for all CRUD operations

### Enhanced Features (P1)
* Search and filtering across projects, tasks, and ideas
* Due date management and basic scheduling
* Export functionality for projects and tasks
* Responsive design for various screen sizes

### Nice-to-Have Features (P2)
* Task templates for recurring work patterns
* Basic reporting and analytics dashboard
* Bulk operations for task management
* Dark/light theme toggle

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
### Phase 1: MVP Foundation (4-6 weeks)
* Docker containerization with volume persistence
* Basic web interface for projects and tasks
* Core CRUD operations and simple progress tracking
* Essential API endpoints

### Phase 2: Enhanced UX (3-4 weeks)
* Visual progress bars and status management
* Ideas capture and project linking
* Search and filtering capabilities
* Responsive design implementation

### Phase 3: Polish & Integration (2-3 weeks)
* Complete API documentation
* Error handling and edge case management
* Performance optimization
* Basic export functionality 