namespace TaskTracker.Api.Models.DTOs;

public class SearchResultDto
{
    public List<ProjectDto> Projects { get; set; } = new();
    public List<TaskDto> Tasks { get; set; } = new();
    public List<IdeaDto> Ideas { get; set; } = new();
    public int TotalResults { get; set; }
}
