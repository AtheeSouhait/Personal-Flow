namespace TaskTracker.Api.Models.DTOs;

public class TaskDto
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int ProjectId { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
    public string Status { get; set; } = "NotStarted";
    public string Priority { get; set; } = "Medium";
    public int ProgressPercentage { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTaskDto
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int ProjectId { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public int? ProgressPercentage { get; set; }
    public DateTime? DueDate { get; set; }
}

public class UpdateTaskDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public int? ProgressPercentage { get; set; }
    public DateTime? DueDate { get; set; }
}
