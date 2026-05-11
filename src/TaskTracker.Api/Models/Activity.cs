namespace TaskTracker.Api.Models;

public class Activity
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int? GoalSeconds { get; set; }
    public ActivityGoalPeriod? GoalPeriod { get; set; }
    public ActivityGoalType? GoalType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ActivityLog> Logs { get; set; } = new List<ActivityLog>();
}

public enum ActivityGoalPeriod
{
    Daily,
    Weekly
}

public enum ActivityGoalType
{
    Target,
    Limit
}
