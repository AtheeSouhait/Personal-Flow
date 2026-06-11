using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Data;
using TaskTracker.Api.Models;
using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public class TaskService : ITaskService
{
    private readonly TaskTrackerDbContext _context;

    public TaskService(TaskTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TaskDto>> GetAllTasksAsync(int? projectId = null)
    {
        var query = _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Subtasks)
            .AsQueryable();

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        var tasks = await query
            .OrderBy(t => t.DisplayOrder).ThenByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tasks.Select(MapToDto);
    }

    public async Task<TaskDto?> GetTaskByIdAsync(int id)
    {
        var task = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Subtasks)
            .FirstOrDefaultAsync(t => t.Id == id);

        return task == null ? null : MapToDto(task);
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto createDto)
    {
        var maxOrder = await _context.Tasks.Where(t => t.ProjectId == createDto.ProjectId).AnyAsync()
            ? await _context.Tasks.Where(t => t.ProjectId == createDto.ProjectId).MaxAsync(t => t.DisplayOrder)
            : -1;

        var task = new ProjectTask
        {
            Title = createDto.Title,
            Description = createDto.Description,
            ProjectId = createDto.ProjectId,
            Status = ParseTaskStatus(createDto.Status),
            Priority = ParseTaskPriority(createDto.Priority),
            ProgressPercentage = createDto.ProgressPercentage ?? 0,
            DisplayOrder = maxOrder + 1,
            DueDate = createDto.DueDate,
            EstimatedMinutes = createDto.EstimatedMinutes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Load project for DTO
        await _context.Entry(task).Reference(t => t.Project).LoadAsync();

        return MapToDto(task);
    }

    public async Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskDto updateDto)
    {
        var task = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Subtasks)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
            return null;

        if (updateDto.Title != null)
            task.Title = updateDto.Title;

        if (updateDto.Description != null)
            task.Description = updateDto.Description;

        if (updateDto.Status != null)
            task.Status = ParseTaskStatus(updateDto.Status);

        if (updateDto.Priority != null)
            task.Priority = ParseTaskPriority(updateDto.Priority);

        if (updateDto.ProgressPercentage.HasValue)
            task.ProgressPercentage = Math.Clamp(updateDto.ProgressPercentage.Value, 0, 100);

        if (updateDto.ClearDueDate == true)
            task.DueDate = null;
        else if (updateDto.DueDate.HasValue)
            task.DueDate = updateDto.DueDate;

        if (updateDto.ClearEstimate == true)
            task.EstimatedMinutes = null;
        else if (updateDto.EstimatedMinutes.HasValue)
            task.EstimatedMinutes = Math.Max(0, updateDto.EstimatedMinutes.Value);

        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<bool> DeleteTaskAsync(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
            return false;

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReorderTasksAsync(ReorderTasksDto dto)
    {
        var tasks = await _context.Tasks
            .Where(t => dto.TaskIds.Contains(t.Id))
            .ToListAsync();

        if (tasks.Count != dto.TaskIds.Count)
            return false;

        for (int i = 0; i < dto.TaskIds.Count; i++)
        {
            var task = tasks.FirstOrDefault(t => t.Id == dto.TaskIds[i]);
            if (task != null)
            {
                task.DisplayOrder = i;
                task.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<TaskDto?> LogTimeAsync(int id, LogTimeDto dto)
    {
        var task = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Subtasks)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
            return null;

        task.ActualSeconds += Math.Max(0, dto.Seconds);
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<SubtaskDto?> CreateSubtaskAsync(int taskId, CreateSubtaskDto dto)
    {
        var taskExists = await _context.Tasks.AnyAsync(t => t.Id == taskId);
        if (!taskExists)
            return null;

        var maxOrder = await _context.Subtasks.Where(s => s.TaskId == taskId).AnyAsync()
            ? await _context.Subtasks.Where(s => s.TaskId == taskId).MaxAsync(s => s.DisplayOrder)
            : -1;

        var subtask = new Subtask
        {
            Title = dto.Title,
            TaskId = taskId,
            DisplayOrder = maxOrder + 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Subtasks.Add(subtask);
        await _context.SaveChangesAsync();

        return MapSubtaskToDto(subtask);
    }

    public async Task<SubtaskDto?> UpdateSubtaskAsync(int id, UpdateSubtaskDto dto)
    {
        var subtask = await _context.Subtasks.FindAsync(id);
        if (subtask == null)
            return null;

        if (dto.Title != null)
            subtask.Title = dto.Title;

        if (dto.IsCompleted.HasValue)
            subtask.IsCompleted = dto.IsCompleted.Value;

        if (dto.DisplayOrder.HasValue)
            subtask.DisplayOrder = dto.DisplayOrder.Value;

        subtask.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapSubtaskToDto(subtask);
    }

    public async Task<bool> DeleteSubtaskAsync(int id)
    {
        var subtask = await _context.Subtasks.FindAsync(id);
        if (subtask == null)
            return false;

        _context.Subtasks.Remove(subtask);
        await _context.SaveChangesAsync();
        return true;
    }

    private static SubtaskDto MapSubtaskToDto(Subtask subtask)
    {
        return new SubtaskDto(
            subtask.Id,
            subtask.Title,
            subtask.TaskId,
            subtask.IsCompleted,
            subtask.DisplayOrder,
            subtask.CreatedAt,
            subtask.UpdatedAt
        );
    }

    private static TaskDto MapToDto(ProjectTask task)
    {
        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            ProjectId = task.ProjectId,
            ProjectTitle = task.Project?.Title ?? string.Empty,
            Status = task.Status.ToString(),
            Priority = task.Priority.ToString(),
            ProgressPercentage = task.ProgressPercentage,
            DisplayOrder = task.DisplayOrder,
            DueDate = task.DueDate,
            EstimatedMinutes = task.EstimatedMinutes,
            ActualSeconds = task.ActualSeconds,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            Subtasks = task.Subtasks
                .OrderBy(s => s.DisplayOrder).ThenBy(s => s.CreatedAt)
                .Select(MapSubtaskToDto)
                .ToList()
        };
    }

    private static Models.TaskStatus ParseTaskStatus(string? status)
    {
        return status != null && Enum.TryParse<Models.TaskStatus>(status, true, out var result)
            ? result
            : Models.TaskStatus.NotStarted;
    }

    private static Models.TaskPriority ParseTaskPriority(string? priority)
    {
        return priority != null && Enum.TryParse<Models.TaskPriority>(priority, true, out var result)
            ? result
            : Models.TaskPriority.Medium;
    }
}
