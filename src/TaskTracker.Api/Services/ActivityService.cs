using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TaskTracker.Api.Data;
using TaskTracker.Api.Models;
using TaskTracker.Api.Models.DTOs;

namespace TaskTracker.Api.Services;

public class ActivityService : IActivityService
{
    private readonly TaskTrackerDbContext _context;

    public ActivityService(TaskTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<List<ActivityEntryDto>> GetEntriesForDateAsync(DateTime date)
    {
        var day = NormalizeDate(date);
        var activities = await _context.Activities
            .Include(a => a.Logs.Where(l => l.Date == day))
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return activities.Select(activity =>
        {
            var log = activity.Logs.FirstOrDefault();
            return MapToEntryDto(activity, log);
        }).ToList();
    }

    public async Task<List<ActivityLogDto>> GetLogsForDateAsync(DateTime date)
    {
        var day = NormalizeDate(date);
        var logs = await _context.ActivityLogs
            .Include(l => l.Activity)
            .Where(l => l.Date == day)
            .OrderBy(l => l.Activity.Name)
            .ToListAsync();

        return logs.Select(MapToLogDto).ToList();
    }

    public async Task<ActivityEntryDto> CreateAsync(DateTime date, CreateActivityDto dto)
    {
        var day = NormalizeDate(date);
        var name = dto.Activity.Trim();
        var normalizedName = name.ToLowerInvariant();

        var activity = await _context.Activities
            .FirstOrDefaultAsync(a => a.Name.ToLower() == normalizedName);

        if (activity == null)
        {
            activity = new Activity
            {
                Name = name,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Activities.Add(activity);
            await _context.SaveChangesAsync();
        }

        var log = await UpsertLogEntityAsync(activity.Id, day, dto.ElapsedSeconds ?? 0, dto.Notes ?? []);
        await _context.SaveChangesAsync();

        return MapToEntryDto(activity, log);
    }

    public async Task<ActivityEntryDto?> UpsertLogAsync(int activityId, DateTime date, UpsertActivityLogDto dto)
    {
        var activity = await _context.Activities.FindAsync(activityId);
        if (activity == null)
            return null;

        var log = await UpsertLogEntityAsync(activityId, NormalizeDate(date), dto.ElapsedSeconds, dto.Notes ?? []);
        await _context.SaveChangesAsync();

        return MapToEntryDto(activity, log);
    }

    public async Task<ActivityDto?> UpdateGoalAsync(int activityId, UpdateActivityGoalDto dto)
    {
        var activity = await _context.Activities.FindAsync(activityId);
        if (activity == null)
            return null;

        activity.GoalSeconds = dto.GoalSeconds;
        activity.GoalPeriod = ParseGoalPeriod(dto.GoalPeriod);
        activity.GoalType = ParseGoalType(dto.GoalType);
        activity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToActivityDto(activity);
    }

    public async Task<bool> DeleteAsync(int activityId)
    {
        var activity = await _context.Activities.FindAsync(activityId);
        if (activity == null)
            return false;

        _context.Activities.Remove(activity);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<ActivityLog> UpsertLogEntityAsync(int activityId, DateTime date, int elapsedSeconds, List<string> notes)
    {
        var log = await _context.ActivityLogs
            .FirstOrDefaultAsync(l => l.ActivityId == activityId && l.Date == date);

        if (log == null)
        {
            log = new ActivityLog
            {
                ActivityId = activityId,
                Date = date,
                CreatedAt = DateTime.UtcNow
            };
            _context.ActivityLogs.Add(log);
        }

        log.ElapsedSeconds = Math.Max(0, elapsedSeconds);
        log.NotesJson = JsonSerializer.Serialize(notes);
        log.UpdatedAt = DateTime.UtcNow;

        return log;
    }

    private static DateTime NormalizeDate(DateTime date) => DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);

    private static ActivityGoalPeriod? ParseGoalPeriod(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return Enum.TryParse<ActivityGoalPeriod>(value, ignoreCase: true, out var parsed) ? parsed : null;
    }

    private static ActivityGoalType? ParseGoalType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return Enum.TryParse<ActivityGoalType>(value, ignoreCase: true, out var parsed) ? parsed : null;
    }

    private static List<string> ParseNotes(string notesJson)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(notesJson) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static ActivityDto MapToActivityDto(Activity activity)
    {
        return new ActivityDto(
            activity.Id,
            activity.Name,
            activity.GoalSeconds,
            activity.GoalPeriod?.ToString().ToLowerInvariant(),
            activity.GoalType?.ToString().ToLowerInvariant(),
            activity.CreatedAt,
            activity.UpdatedAt
        );
    }

    private static ActivityEntryDto MapToEntryDto(Activity activity, ActivityLog? log)
    {
        var elapsedSeconds = log?.ElapsedSeconds ?? 0;
        return new ActivityEntryDto(
            activity.Id,
            activity.Name,
            SecondsToDuration(elapsedSeconds),
            elapsedSeconds,
            activity.GoalSeconds,
            activity.GoalPeriod?.ToString().ToLowerInvariant(),
            activity.GoalType?.ToString().ToLowerInvariant(),
            log == null ? [] : ParseNotes(log.NotesJson)
        );
    }

    private static ActivityLogDto MapToLogDto(ActivityLog log)
    {
        return new ActivityLogDto(
            log.Id,
            log.ActivityId,
            log.Date,
            log.ElapsedSeconds,
            SecondsToDuration(log.ElapsedSeconds),
            ParseNotes(log.NotesJson),
            log.CreatedAt,
            log.UpdatedAt
        );
    }

    private static string SecondsToDuration(int seconds)
    {
        var safeSeconds = Math.Max(0, seconds);
        var hours = safeSeconds / 3600;
        var minutes = safeSeconds % 3600 / 60;
        return $"{hours:00}:{minutes:00}";
    }
}
