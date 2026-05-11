using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public interface IActivityService
{
    Task<List<ActivityEntryDto>> GetEntriesForDateAsync(DateTime date);
    Task<List<ActivityLogDto>> GetLogsForDateAsync(DateTime date);
    Task<ActivityEntryDto> CreateAsync(DateTime date, CreateActivityDto dto);
    Task<ActivityEntryDto?> UpsertLogAsync(int activityId, DateTime date, UpsertActivityLogDto dto);
    Task<ActivityDto?> UpdateGoalAsync(int activityId, UpdateActivityGoalDto dto);
    Task<bool> DeleteAsync(int activityId);
}
