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
        var query = _context.Tasks.Include(t => t.Project).AsQueryable();

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

        if (updateDto.DueDate.HasValue)
            task.DueDate = updateDto.DueDate;

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
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
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
