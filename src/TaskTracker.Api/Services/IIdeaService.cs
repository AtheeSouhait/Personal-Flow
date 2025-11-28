using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public interface IIdeaService
{
    Task<IEnumerable<IdeaDto>> GetAllIdeasAsync(int? projectId = null);
    Task<IdeaDto?> GetIdeaByIdAsync(int id);
    Task<IdeaDto> CreateIdeaAsync(CreateIdeaDto createDto);
    Task<IdeaDto?> UpdateIdeaAsync(int id, UpdateIdeaDto updateDto);
    Task<bool> DeleteIdeaAsync(int id);
}
