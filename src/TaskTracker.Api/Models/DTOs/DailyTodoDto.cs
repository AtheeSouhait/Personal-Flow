namespace TaskTracker.Api.Models.DTOs;

public record DailyTodoDto(
    int Id,
    string Title,
    string? Description,
    bool IsCompleted,
    bool IsRecurring,
    DateTime? CompletedAt,
    int DisplayOrder,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateDailyTodoDto(
    string Title,
    string? Description,
    bool? IsRecurring
);

public record UpdateDailyTodoDto(
    string? Title,
    string? Description,
    bool? IsCompleted,
    bool? IsRecurring,
    int? DisplayOrder
);

public record ReorderDailyTodosDto(
    List<int> TodoIds
);
