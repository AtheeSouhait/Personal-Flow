namespace TaskTracker.Api.Models;

public class Project
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; } // Markdown supported
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;

    // Navigation properties
    public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    public ICollection<Idea> Ideas { get; set; } = new List<Idea>();
}

public enum ProjectStatus
{
    Active,
    Completed,
    Archived
}
