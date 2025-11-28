using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Data;
using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public class SearchService : ISearchService
{
    private readonly TaskTrackerDbContext _context;

    public SearchService(TaskTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<SearchResultDto> SearchAsync(string query)
    {
        var searchTerm = query.ToLower();

        var projects = await _context.Projects
            .Include(p => p.Tasks)
            .Include(p => p.Ideas)
            .Where(p => p.Title.ToLower().Contains(searchTerm) ||
                       (p.Description != null && p.Description.ToLower().Contains(searchTerm)))
            .ToListAsync();

        var tasks = await _context.Tasks
            .Include(t => t.Project)
            .Where(t => t.Title.ToLower().Contains(searchTerm) ||
                       (t.Description != null && t.Description.ToLower().Contains(searchTerm)))
            .ToListAsync();

        var ideas = await _context.Ideas
            .Include(i => i.Project)
            .Where(i => i.Title.ToLower().Contains(searchTerm) ||
                       (i.Description != null && i.Description.ToLower().Contains(searchTerm)))
            .ToListAsync();

        var result = new SearchResultDto
        {
            Projects = projects.Select(p =>
            {
                var completedTasks = p.Tasks.Count(t => t.Status == Models.TaskStatus.Completed);
                var totalTasks = p.Tasks.Count;
                var progress = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0;

                return new ProjectDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    Status = p.Status.ToString(),
                    TaskCount = totalTasks,
                    CompletedTaskCount = completedTasks,
                    IdeaCount = p.Ideas.Count,
                    ProgressPercentage = Math.Round(progress, 2)
                };
            }).ToList(),
            Tasks = tasks.Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                ProjectId = t.ProjectId,
                ProjectTitle = t.Project?.Title ?? string.Empty,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                ProgressPercentage = t.ProgressPercentage,
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            }).ToList(),
            Ideas = ideas.Select(i => new IdeaDto
            {
                Id = i.Id,
                Title = i.Title,
                Description = i.Description,
                ProjectId = i.ProjectId,
                ProjectTitle = i.Project?.Title ?? string.Empty,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            }).ToList()
        };

        result.TotalResults = result.Projects.Count + result.Tasks.Count + result.Ideas.Count;

        return result;
    }
}
