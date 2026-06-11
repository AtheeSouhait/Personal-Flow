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
  displayOrder: number;
}

export interface ProjectDetail extends Project {
  tasks: Task[];
  ideas: Idea[];
}

export interface Subtask {
  id: number;
  title: string;
  taskId: number;
  isCompleted: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
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
  displayOrder: number;
  dueDate?: string;
  estimatedMinutes?: number;
  actualSeconds: number;
  subtasks: Subtask[];
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
  estimatedMinutes?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  progressPercentage?: number;
  dueDate?: string;
  clearDueDate?: boolean;
  estimatedMinutes?: number;
  clearEstimate?: boolean;
}

export interface CreateSubtaskDto {
  title: string;
}

export interface UpdateSubtaskDto {
  title?: string;
  isCompleted?: boolean;
  displayOrder?: number;
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
  isRecurring: boolean;
  completedAt?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyTodoDto {
  title: string;
  description?: string;
  isRecurring?: boolean;
}

export interface UpdateDailyTodoDto {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  isRecurring?: boolean;
  displayOrder?: number;
}

export interface ReorderDailyTodosDto {
  todoIds: number[];
}

export interface ReorderProjectsDto {
  projectIds: number[];
}

export interface ReorderTasksDto {
  taskIds: number[];
}

export interface ActivityEntry {
  id: number;
  activity: string;
  duration: string;
  elapsedSeconds: number;
  goalSeconds?: number;
  goalPeriod?: 'daily' | 'weekly';
  goalType?: 'target' | 'limit';
  notes: string[];
}

export interface ActivityLog {
  id: number;
  activityId: number;
  date: string;
  elapsedSeconds: number;
  duration: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityDto {
  activity: string;
  elapsedSeconds?: number;
  notes?: string[];
}

export interface UpdateActivityGoalDto {
  goalSeconds?: number;
  goalPeriod?: 'daily' | 'weekly';
  goalType?: 'target' | 'limit';
}

export interface UpsertActivityLogDto {
  elapsedSeconds: number;
  notes?: string[];
}
