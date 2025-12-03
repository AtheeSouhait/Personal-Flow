namespace TaskTracker.Api.Models.DTOs;

public record DailyTodoDto(
    int Id,
    string Title,
    string? Description,
    bool IsCompleted,
    int DisplayOrder,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateDailyTodoDto(
    string Title,
    string? Description
);

public record UpdateDailyTodoDto(
    string? Title,
    string? Description,
    bool? IsCompleted,
    int? DisplayOrder
);

public record ReorderDailyTodosDto(
    List<int> TodoIds
);
