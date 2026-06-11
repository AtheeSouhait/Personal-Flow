namespace TaskTracker.Api.Models.DTOs;

public record SubtaskDto(
    int Id,
    string Title,
    int TaskId,
    bool IsCompleted,
    int DisplayOrder,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateSubtaskDto(
    string Title
);

public record UpdateSubtaskDto(
    string? Title,
    bool? IsCompleted,
    int? DisplayOrder
);
