using Microsoft.AspNetCore.Mvc;
using TaskTracker.Api.Models.DTOs;
using TaskTracker.Api.Services;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    /// <summary>
    /// Get all projects
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects()
    {
        var projects = await _projectService.GetAllProjectsAsync();
        return Ok(projects);
    }

    /// <summary>
    /// Get a specific project by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDetailDto>> GetProject(int id)
    {
        var project = await _projectService.GetProjectByIdAsync(id);
        if (project == null)
            return NotFound(new { message = "Project not found" });

        return Ok(project);
    }

    /// <summary>
    /// Create a new project
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProjectDetailDto>> CreateProject(CreateProjectDto createDto)
    {
        var project = await _projectService.CreateProjectAsync(createDto);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    /// <summary>
    /// Update an existing project
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ProjectDetailDto>> UpdateProject(int id, UpdateProjectDto updateDto)
    {
        var project = await _projectService.UpdateProjectAsync(id, updateDto);
        if (project == null)
            return NotFound(new { message = "Project not found" });

        return Ok(project);
    }

    /// <summary>
    /// Reorder projects
    /// </summary>
    [HttpPost("reorder")]
    public async Task<ActionResult> ReorderProjects([FromBody] ReorderProjectsDto dto)
    {
        var success = await _projectService.ReorderProjectsAsync(dto);
        if (!success)
            return BadRequest("Invalid project IDs provided");

        return NoContent();
    }

    /// <summary>
    /// Delete a project
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProject(int id)
    {
        var result = await _projectService.DeleteProjectAsync(id);
        if (!result)
            return NotFound(new { message = "Project not found" });

        return NoContent();
    }
}
