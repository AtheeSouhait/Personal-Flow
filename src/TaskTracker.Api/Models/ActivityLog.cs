namespace TaskTracker.Api.Models;

public class ActivityLog
{
    public int Id { get; set; }
    public int ActivityId { get; set; }
    public DateTime Date { get; set; }
    public int ElapsedSeconds { get; set; }
    public string NotesJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Activity Activity { get; set; } = null!;
}
