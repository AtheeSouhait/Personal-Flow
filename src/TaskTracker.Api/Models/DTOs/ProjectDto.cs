namespace TaskTracker.Api.Models.DTOs;

public class ProjectDto
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Status { get; set; } = "Active";
    public int TaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
    public int IdeaCount { get; set; }
    public double ProgressPercentage { get; set; }
}

public class ProjectDetailDto : ProjectDto
{
    public List<TaskDto> Tasks { get; set; } = new();
    public List<IdeaDto> Ideas { get; set; } = new();
}

public class CreateProjectDto
{
    public required string Title { get; set; }
    public string? Description { get; set; }
}

public class UpdateProjectDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; }
}
