using Microsoft.AspNetCore.Mvc;
using TaskTracker.Api.Models.DTOs;
using TaskTracker.Api.Services;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/daily-todos")]
public class DailyTodosController : ControllerBase
{
    private readonly IDailyTodoService _service;

    public DailyTodosController(IDailyTodoService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<DailyTodoDto>>> GetAll()
    {
        var todos = await _service.GetAllAsync();
        return Ok(todos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DailyTodoDto>> GetById(int id)
    {
        var todo = await _service.GetByIdAsync(id);
        if (todo == null)
            return NotFound();

        return Ok(todo);
    }

    [HttpPost]
    public async Task<ActionResult<DailyTodoDto>> Create([FromBody] CreateDailyTodoDto dto)
    {
        var todo = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = todo.Id }, todo);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DailyTodoDto>> Update(int id, [FromBody] UpdateDailyTodoDto dto)
    {
        var todo = await _service.UpdateAsync(id, dto);
        if (todo == null)
            return NotFound();

        return Ok(todo);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success)
            return NotFound();

        return NoContent();
    }

    [HttpPost("reorder")]
    public async Task<ActionResult> Reorder([FromBody] ReorderDailyTodosDto dto)
    {
        var success = await _service.ReorderAsync(dto);
        if (!success)
            return BadRequest("Invalid todo IDs provided");

        return NoContent();
    }
}
