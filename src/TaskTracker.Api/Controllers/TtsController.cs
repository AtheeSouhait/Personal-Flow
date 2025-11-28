using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace TaskTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TtsController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TtsController> _logger;

    public TtsController(IHttpClientFactory httpClientFactory, ILogger<TtsController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpPost("synthesize")]
    public async Task<IActionResult> Synthesize([FromBody] TtsRequest request)
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(10);

            // Create JSON with exact property names expected by TTS service
            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request, jsonOptions),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            // Use host.docker.internal to access services on host machine from Docker
            var response = await httpClient.PostAsync(
                "http://host.docker.internal:8080/synthesize",
                content
            );

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("TTS service returned status code: {StatusCode}", response.StatusCode);
                return StatusCode(503, "TTS service unavailable");
            }

            var audioData = await response.Content.ReadAsByteArrayAsync();
            return File(audioData, "audio/wav");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to TTS service");
            return StatusCode(503, "TTS service unavailable");
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "TTS service request timed out");
            return StatusCode(504, "TTS service timeout");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling TTS service");
            return StatusCode(500, "Internal server error");
        }
    }
}

public record TtsRequest(string Text, string VoiceStyle);
