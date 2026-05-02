using ChalkScore.Api.Data.Entities;
using ChalkScore.Api.Data.Repositories;
using ChalkScore.Api.DTOs;
using ChalkScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChalkScore.Api.Controllers;

[ApiController]
[Route("feedback")]
[Authorize(Policy = "AnyUser")]
public class FeedbackController(
    IFeedbackRepository feedback,
    UserSyncService userSync,
    GitHubService gitHub,
    IConfiguration config,
    ILogger<FeedbackController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitFeedbackRequest request)
    {
        var user = await userSync.SyncAsync(User);

        var item = new FeedbackItem
        {
            SubmittedByAuth0Id = user.Auth0Id,
            SubmittedByName    = $"{user.FirstName} {user.LastName}",
            SubmittedByEmail   = user.Email,
            Type               = request.Type,
            Description        = request.Description,
            StepsToReproduce   = request.StepsToReproduce,
            Frequency          = request.Frequency,
            IsNewFeature       = request.IsNewFeature,
            CurrentPage        = request.CurrentPage,
            ConsoleErrors      = request.ConsoleErrors,
            Environment        = config["App:Environment"] ?? "Unknown",
        };

        await feedback.SaveAsync(item);

        try { await gitHub.CreateIssueAsync(item); }
        catch (Exception ex) { logger.LogError(ex, "Failed to create GitHub issue for feedback {Id}", item.Id); }

        return Ok();
    }
}
