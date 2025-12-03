export interface Project {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'Active' | 'Completed' | 'Archived';
  taskCount: number;
  completedTaskCount: number;
  ideaCount: number;
  progressPercentage: number;
}

export interface ProjectDetail extends Project {
  tasks: Task[];
  ideas: Idea[];
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  projectTitle: string;
  status: 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  progressPercentage: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  projectTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  projects: Project[];
  tasks: Task[];
  ideas: Idea[];
  totalResults: number;
}

export interface CreateProjectDto {
  title: string;
  description?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  projectId: number;
  status?: string;
  priority?: string;
  progressPercentage?: number;
  dueDate?: string;
}

export interface CreateIdeaDto {
  title: string;
  description?: string;
  projectId: number;
}

export interface DailyTodo {
  id: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyTodoDto {
  title: string;
  description?: string;
}

export interface UpdateDailyTodoDto {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  displayOrder?: number;
}

export interface ReorderDailyTodosDto {
  todoIds: number[];
}
