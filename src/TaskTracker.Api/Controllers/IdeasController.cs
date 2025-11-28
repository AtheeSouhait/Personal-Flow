using Microsoft.AspNetCore.Mvc;
using TaskTracker.Api.Models.DTOs;
using TaskTracker.Api.Services;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IdeasController : ControllerBase
{
    private readonly IIdeaService _ideaService;

    public IdeasController(IIdeaService ideaService)
    {
        _ideaService = ideaService;
    }

    /// <summary>
    /// Get all ideas, optionally filtered by project
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IdeaDto>>> GetIdeas([FromQuery] int? projectId = null)
    {
        var ideas = await _ideaService.GetAllIdeasAsync(projectId);
        return Ok(ideas);
    }

    /// <summary>
    /// Get a specific idea by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<IdeaDto>> GetIdea(int id)
    {
        var idea = await _ideaService.GetIdeaByIdAsync(id);
        if (idea == null)
            return NotFound(new { message = "Idea not found" });

        return Ok(idea);
    }

    /// <summary>
    /// Create a new idea
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<IdeaDto>> CreateIdea(CreateIdeaDto createDto)
    {
        var idea = await _ideaService.CreateIdeaAsync(createDto);
        return CreatedAtAction(nameof(GetIdea), new { id = idea.Id }, idea);
    }

    /// <summary>
    /// Update an existing idea
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<IdeaDto>> UpdateIdea(int id, UpdateIdeaDto updateDto)
    {
        var idea = await _ideaService.UpdateIdeaAsync(id, updateDto);
        if (idea == null)
            return NotFound(new { message = "Idea not found" });

        return Ok(idea);
    }

    /// <summary>
    /// Delete an idea
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteIdea(int id)
    {
        var result = await _ideaService.DeleteIdeaAsync(id);
        if (!result)
            return NotFound(new { message = "Idea not found" });

        return NoContent();
    }
}
