namespace TaskTracker.Api.Models;

public class Subtask
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public int TaskId { get; set; }
    public bool IsCompleted { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ProjectTask? Task { get; set; }
}
