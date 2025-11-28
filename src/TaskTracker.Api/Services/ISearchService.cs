using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public interface ISearchService
{
    Task<SearchResultDto> SearchAsync(string query);
}
