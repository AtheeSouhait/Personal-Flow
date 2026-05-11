using Microsoft.AspNetCore.Mvc;
using TaskTracker.Api.Models.DTOs;
using TaskTracker.Api.Services;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/activities")]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _service;

    public ActivitiesController(IActivityService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<ActivityEntryDto>>> GetEntries([FromQuery] DateTime date)
    {
        var entries = await _service.GetEntriesForDateAsync(date == default ? DateTime.UtcNow : date);
        return Ok(entries);
    }

    [HttpGet("logs")]
    public async Task<ActionResult<List<ActivityLogDto>>> GetLogs([FromQuery] DateTime date)
    {
        var logs = await _service.GetLogsForDateAsync(date == default ? DateTime.UtcNow : date);
        return Ok(logs);
    }

    [HttpPost]
    public async Task<ActionResult<ActivityEntryDto>> Create([FromQuery] DateTime date, [FromBody] CreateActivityDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Activity))
            return BadRequest("Activity is required");

        var entry = await _service.CreateAsync(date == default ? DateTime.UtcNow : date, dto);
        return CreatedAtAction(nameof(GetEntries), new { date }, entry);
    }

    [HttpPut("{activityId:int}/goal")]
    public async Task<ActionResult<ActivityDto>> UpdateGoal(int activityId, [FromBody] UpdateActivityGoalDto dto)
    {
        var activity = await _service.UpdateGoalAsync(activityId, dto);
        if (activity == null)
            return NotFound();

        return Ok(activity);
    }

    [HttpPut("{activityId:int}/logs/{date}")]
    public async Task<ActionResult<ActivityEntryDto>> UpsertLog(int activityId, DateTime date, [FromBody] UpsertActivityLogDto dto)
    {
        var entry = await _service.UpsertLogAsync(activityId, date, dto);
        if (entry == null)
            return NotFound();

        return Ok(entry);
    }

    [HttpDelete("{activityId:int}")]
    public async Task<ActionResult> Delete(int activityId)
    {
        var success = await _service.DeleteAsync(activityId);
        if (!success)
            return NotFound();

        return NoContent();
    }
}
