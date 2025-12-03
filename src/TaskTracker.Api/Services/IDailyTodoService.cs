using TaskTracker.Api.Models;
using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public interface IDailyTodoService
{
    Task<List<DailyTodoDto>> GetAllAsync();
    Task<DailyTodoDto?> GetByIdAsync(int id);
    Task<DailyTodoDto> CreateAsync(CreateDailyTodoDto dto);
    Task<DailyTodoDto?> UpdateAsync(int id, UpdateDailyTodoDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> ReorderAsync(ReorderDailyTodosDto dto);
}
