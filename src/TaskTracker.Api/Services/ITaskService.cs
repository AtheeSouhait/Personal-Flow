using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public interface ITaskService
{
    Task<IEnumerable<TaskDto>> GetAllTasksAsync(int? projectId = null);
    Task<TaskDto?> GetTaskByIdAsync(int id);
    Task<TaskDto> CreateTaskAsync(CreateTaskDto createDto);
    Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskDto updateDto);
    Task<bool> DeleteTaskAsync(int id);
}
