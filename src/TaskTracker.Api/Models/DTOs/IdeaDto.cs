namespace TaskTracker.Api.Models.DTOs;

public class IdeaDto
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int ProjectId { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateIdeaDto
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int ProjectId { get; set; }
}

public class UpdateIdeaDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
}
