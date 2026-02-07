using Microsoft.AspNetCore.Mvc;
using TaskTracker.Api.Models.DTOs;
using TaskTracker.Api.Services;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// Get all tasks, optionally filtered by project
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks([FromQuery] int? projectId = null)
    {
        var tasks = await _taskService.GetAllTasksAsync(projectId);
        return Ok(tasks);
    }

    /// <summary>
    /// Get a specific task by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TaskDto>> GetTask(int id)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        if (task == null)
            return NotFound(new { message = "Task not found" });

        return Ok(task);
    }

    /// <summary>
    /// Create a new task
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TaskDto>> CreateTask(CreateTaskDto createDto)
    {
        var task = await _taskService.CreateTaskAsync(createDto);
        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    /// <summary>
    /// Update an existing task
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<TaskDto>> UpdateTask(int id, UpdateTaskDto updateDto)
    {
        var task = await _taskService.UpdateTaskAsync(id, updateDto);
        if (task == null)
            return NotFound(new { message = "Task not found" });

        return Ok(task);
    }

    /// <summary>
    /// Reorder tasks
    /// </summary>
    [HttpPost("reorder")]
    public async Task<ActionResult> ReorderTasks([FromBody] ReorderTasksDto dto)
    {
        var success = await _taskService.ReorderTasksAsync(dto);
        if (!success)
            return BadRequest("Invalid task IDs provided");

        return NoContent();
    }

    /// <summary>
    /// Delete a task
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTask(int id)
    {
        var result = await _taskService.DeleteTaskAsync(id);
        if (!result)
            return NotFound(new { message = "Task not found" });

        return NoContent();
    }
}
