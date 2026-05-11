namespace TaskTracker.Api.Models.DTOs;

public record ActivityDto(
    int Id,
    string Activity,
    int? GoalSeconds,
    string? GoalPeriod,
    string? GoalType,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ActivityLogDto(
    int Id,
    int ActivityId,
    DateTime Date,
    int ElapsedSeconds,
    string Duration,
    List<string> Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ActivityEntryDto(
    int Id,
    string Activity,
    string Duration,
    int ElapsedSeconds,
    int? GoalSeconds,
    string? GoalPeriod,
    string? GoalType,
    List<string> Notes
);

public record CreateActivityDto(
    string Activity,
    int? ElapsedSeconds,
    List<string>? Notes
);

public record UpdateActivityGoalDto(
    int? GoalSeconds,
    string? GoalPeriod,
    string? GoalType
);

public record UpsertActivityLogDto(
    int ElapsedSeconds,
    List<string>? Notes
);
