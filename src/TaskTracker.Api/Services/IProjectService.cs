using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetAllProjectsAsync();
    Task<ProjectDetailDto?> GetProjectByIdAsync(int id);
    Task<ProjectDetailDto> CreateProjectAsync(CreateProjectDto createDto);
    Task<ProjectDetailDto?> UpdateProjectAsync(int id, UpdateProjectDto updateDto);
    Task<bool> DeleteProjectAsync(int id);
    Task<bool> ReorderProjectsAsync(ReorderProjectsDto dto);
}
