using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Data;
using TaskTracker.Api.Models;
using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public class ProjectService : IProjectService
{
    private readonly TaskTrackerDbContext _context;

    public ProjectService(TaskTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProjectDto>> GetAllProjectsAsync()
    {
        var projects = await _context.Projects
            .Include(p => p.Tasks)
            .Include(p => p.Ideas)
            .OrderBy(p => p.DisplayOrder).ThenByDescending(p => p.CreatedAt)
            .ToListAsync();

        return projects.Select(MapToDto);
    }

    public async Task<ProjectDetailDto?> GetProjectByIdAsync(int id)
    {
        var project = await _context.Projects
            .Include(p => p.Tasks)
            .Include(p => p.Ideas)
            .FirstOrDefaultAsync(p => p.Id == id);

        return project == null ? null : MapToDetailDto(project);
    }

    public async Task<ProjectDetailDto> CreateProjectAsync(CreateProjectDto createDto)
    {
        var maxOrder = await _context.Projects.AnyAsync()
            ? await _context.Projects.MaxAsync(p => p.DisplayOrder)
            : -1;

        var project = new Project
        {
            Title = createDto.Title,
            Description = createDto.Description,
            DisplayOrder = maxOrder + 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return MapToDetailDto(project);
    }

    public async Task<ProjectDetailDto?> UpdateProjectAsync(int id, UpdateProjectDto updateDto)
    {
        var project = await _context.Projects
            .Include(p => p.Tasks)
            .Include(p => p.Ideas)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
            return null;

        if (updateDto.Title != null)
            project.Title = updateDto.Title;

        if (updateDto.Description != null)
            project.Description = updateDto.Description;

        if (updateDto.Status != null && Enum.TryParse<ProjectStatus>(updateDto.Status, out var status))
            project.Status = status;

        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDetailDto(project);
    }

    public async Task<bool> DeleteProjectAsync(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null)
            return false;

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReorderProjectsAsync(ReorderProjectsDto dto)
    {
        var projects = await _context.Projects
            .Where(p => dto.ProjectIds.Contains(p.Id))
            .ToListAsync();

        if (projects.Count != dto.ProjectIds.Count)
            return false;

        for (int i = 0; i < dto.ProjectIds.Count; i++)
        {
            var project = projects.FirstOrDefault(p => p.Id == dto.ProjectIds[i]);
            if (project != null)
            {
                project.DisplayOrder = i;
                project.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static ProjectDto MapToDto(Project project)
    {
        var completedTasks = project.Tasks.Count(t => t.Status == Models.TaskStatus.Completed);
        var totalTasks = project.Tasks.Count;

        // Calculate progress as: (Sum of % of InProgress+Blocked+Completed tasks) / (total tasks)
        var relevantTasks = project.Tasks.Where(t =>
            t.Status == Models.TaskStatus.InProgress ||
            t.Status == Models.TaskStatus.Blocked ||
            t.Status == Models.TaskStatus.Completed);

        var sumOfProgress = relevantTasks.Sum(t => t.ProgressPercentage);
        var progress = totalTasks > 0 ? (double)sumOfProgress / totalTasks : 0.0;

        return new ProjectDto
        {
            Id = project.Id,
            Title = project.Title,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Status = project.Status.ToString(),
            TaskCount = totalTasks,
            CompletedTaskCount = completedTasks,
            IdeaCount = project.Ideas.Count,
            ProgressPercentage = Math.Round(progress, 2),
            DisplayOrder = project.DisplayOrder
        };
    }

    private static ProjectDetailDto MapToDetailDto(Project project)
    {
        var dto = MapToDto(project);
        return new ProjectDetailDto
        {
            Id = dto.Id,
            Title = dto.Title,
            Description = dto.Description,
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt,
            Status = dto.Status,
            TaskCount = dto.TaskCount,
            CompletedTaskCount = dto.CompletedTaskCount,
            IdeaCount = dto.IdeaCount,
            ProgressPercentage = dto.ProgressPercentage,
            Tasks = project.Tasks.OrderBy(t => t.DisplayOrder).ThenByDescending(t => t.CreatedAt).Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                ProjectId = t.ProjectId,
                ProjectTitle = project.Title,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                ProgressPercentage = t.ProgressPercentage,
                DisplayOrder = t.DisplayOrder,
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            }).ToList(),
            Ideas = project.Ideas.Select(i => new IdeaDto
            {
                Id = i.Id,
                Title = i.Title,
                Description = i.Description,
                ProjectId = i.ProjectId,
                ProjectTitle = project.Title,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            }).ToList()
        };
    }
}
