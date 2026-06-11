using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public interface ITaskService
{
    Task<IEnumerable<TaskDto>> GetAllTasksAsync(int? projectId = null);
    Task<TaskDto?> GetTaskByIdAsync(int id);
    Task<TaskDto> CreateTaskAsync(CreateTaskDto createDto);
    Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskDto updateDto);
    Task<bool> DeleteTaskAsync(int id);
    Task<bool> ReorderTasksAsync(ReorderTasksDto dto);
    Task<TaskDto?> LogTimeAsync(int id, LogTimeDto dto);
    Task<SubtaskDto?> CreateSubtaskAsync(int taskId, CreateSubtaskDto dto);
    Task<SubtaskDto?> UpdateSubtaskAsync(int id, UpdateSubtaskDto dto);
    Task<bool> DeleteSubtaskAsync(int id);
}
