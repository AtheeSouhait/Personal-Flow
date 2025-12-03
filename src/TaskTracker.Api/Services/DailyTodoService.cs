using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Data;
using TaskTracker.Api.Models;
using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public class DailyTodoService : IDailyTodoService
{
    private readonly TaskTrackerDbContext _context;

    public DailyTodoService(TaskTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<List<DailyTodoDto>> GetAllAsync()
    {
        var todos = await _context.DailyTodos
            .OrderBy(t => t.DisplayOrder)
            .ThenBy(t => t.CreatedAt)
            .ToListAsync();

        return todos.Select(MapToDto).ToList();
    }

    public async Task<DailyTodoDto?> GetByIdAsync(int id)
    {
        var todo = await _context.DailyTodos.FindAsync(id);
        return todo == null ? null : MapToDto(todo);
    }

    public async Task<DailyTodoDto> CreateAsync(CreateDailyTodoDto dto)
    {
        // Get the max display order and increment
        var maxOrder = await _context.DailyTodos.AnyAsync()
            ? await _context.DailyTodos.MaxAsync(t => t.DisplayOrder)
            : -1;

        var todo = new DailyTodo
        {
            Title = dto.Title,
            Description = dto.Description,
            DisplayOrder = maxOrder + 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.DailyTodos.Add(todo);
        await _context.SaveChangesAsync();

        return MapToDto(todo);
    }

    public async Task<DailyTodoDto?> UpdateAsync(int id, UpdateDailyTodoDto dto)
    {
        var todo = await _context.DailyTodos.FindAsync(id);
        if (todo == null)
            return null;

        if (dto.Title != null)
            todo.Title = dto.Title;

        if (dto.Description != null)
            todo.Description = dto.Description;

        if (dto.IsCompleted.HasValue)
            todo.IsCompleted = dto.IsCompleted.Value;

        if (dto.DisplayOrder.HasValue)
            todo.DisplayOrder = dto.DisplayOrder.Value;

        todo.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(todo);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var todo = await _context.DailyTodos.FindAsync(id);
        if (todo == null)
            return false;

        _context.DailyTodos.Remove(todo);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ReorderAsync(ReorderDailyTodosDto dto)
    {
        var todos = await _context.DailyTodos
            .Where(t => dto.TodoIds.Contains(t.Id))
            .ToListAsync();

        if (todos.Count != dto.TodoIds.Count)
            return false;

        for (int i = 0; i < dto.TodoIds.Count; i++)
        {
            var todo = todos.FirstOrDefault(t => t.Id == dto.TodoIds[i]);
            if (todo != null)
            {
                todo.DisplayOrder = i;
                todo.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static DailyTodoDto MapToDto(DailyTodo todo)
    {
        return new DailyTodoDto(
            todo.Id,
            todo.Title,
            todo.Description,
            todo.IsCompleted,
            todo.DisplayOrder,
            todo.CreatedAt,
            todo.UpdatedAt
        );
    }
}
