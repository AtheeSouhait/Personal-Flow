namespace TaskTracker.Api.Models;

public class ProjectTask
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int ProjectId { get; set; }
    public TaskStatus Status { get; set; } = TaskStatus.NotStarted;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public int ProgressPercentage { get; set; } = 0; // 0-100
    public DateTime? DueDate { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Project? Project { get; set; }
}

public enum TaskStatus
{
    NotStarted,
    InProgress,
    Completed,
    Blocked
}

public enum TaskPriority
{
    Low,
    Medium,
    High,
    Critical
}
