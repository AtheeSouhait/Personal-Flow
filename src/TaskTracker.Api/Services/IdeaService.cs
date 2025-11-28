using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Data;
using TaskTracker.Api.Models;
using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public class IdeaService : IIdeaService
{
    private readonly TaskTrackerDbContext _context;

    public IdeaService(TaskTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<IdeaDto>> GetAllIdeasAsync(int? projectId = null)
    {
        var query = _context.Ideas.Include(i => i.Project).AsQueryable();

        if (projectId.HasValue)
            query = query.Where(i => i.ProjectId == projectId.Value);

        var ideas = await query
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return ideas.Select(MapToDto);
    }

    public async Task<IdeaDto?> GetIdeaByIdAsync(int id)
    {
        var idea = await _context.Ideas
            .Include(i => i.Project)
            .FirstOrDefaultAsync(i => i.Id == id);

        return idea == null ? null : MapToDto(idea);
    }

    public async Task<IdeaDto> CreateIdeaAsync(CreateIdeaDto createDto)
    {
        var idea = new Idea
        {
            Title = createDto.Title,
            Description = createDto.Description,
            ProjectId = createDto.ProjectId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Ideas.Add(idea);
        await _context.SaveChangesAsync();

        // Load project for DTO
        await _context.Entry(idea).Reference(i => i.Project).LoadAsync();

        return MapToDto(idea);
    }

    public async Task<IdeaDto?> UpdateIdeaAsync(int id, UpdateIdeaDto updateDto)
    {
        var idea = await _context.Ideas
            .Include(i => i.Project)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (idea == null)
            return null;

        if (updateDto.Title != null)
            idea.Title = updateDto.Title;

        if (updateDto.Description != null)
            idea.Description = updateDto.Description;

        idea.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(idea);
    }

    public async Task<bool> DeleteIdeaAsync(int id)
    {
        var idea = await _context.Ideas.FindAsync(id);
        if (idea == null)
            return false;

        _context.Ideas.Remove(idea);
        await _context.SaveChangesAsync();
        return true;
    }

    private static IdeaDto MapToDto(Idea idea)
    {
        return new IdeaDto
        {
            Id = idea.Id,
            Title = idea.Title,
            Description = idea.Description,
            ProjectId = idea.ProjectId,
            ProjectTitle = idea.Project?.Title ?? string.Empty,
            CreatedAt = idea.CreatedAt,
            UpdatedAt = idea.UpdatedAt
        };
    }
}
